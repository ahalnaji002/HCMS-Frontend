import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Logo from "@/presentation/components/common/Logo";
import LanguageToggle from "@/presentation/components/common/LanguageToggle";
import ThemeToggle from "@/presentation/components/common/ThemeToggle";

import { useAuth } from "@/presentation/context/useAuth";
import { useTheme } from "@/presentation/context/ThemeContext";
import { useApplicationServices } from "@/app/useApplicationServices";
import { normalizeApiError } from "@/presentation/utils/normalizeApiError";
import { roleRoutes } from "@/presentation/routing/roleRoutes";
import { consumeSessionExpired } from "@/presentation/context/sessionExpiry";
import { Alert, Button, TextField } from "@/presentation/components/ui";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  // Read once: shown after an expired session redirected here.
  const [sessionExpired] = useState(consumeSessionExpired);
  const returnTo = typeof location.state?.from === "string" ? location.state.from : null;

  const { startSession } = useAuth();
  const { auth } = useApplicationServices();
  const { theme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [application, setApplication] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = {};

    if (!email.trim()) {
      validationErrors.email = t("login.errors.emailRequired");
    }

    if (!password) {
      validationErrors.password = t("login.errors.passwordRequired");
    }

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError("");
      return;
    }

    setError("");
    setApplication(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await auth.login({
        email: email.trim(),
        password,
      });

      const { token, user } = response.data;
      const destination = roleRoutes[user.role];

      if (!destination) {
        setError(t("login.errors.unknownRole"));
        return;
      }

      startSession(token, user);
      // Back to the page the session expired on, if it belongs to this role.
      const canReturn = returnTo && (returnTo === destination || returnTo.startsWith(`${destination}/`));
      navigate(canReturn ? returnTo : destination, { replace: true });
    } catch (requestError) {
      const { type, application: applicantStatus } =
        normalizeApiError(requestError);

      if (type === "validation") {
        setError(t("login.errors.invalidRequest"));
      } else if (type === "unauthorized") {
        setError(t("login.errors.invalidCredentials"));
      } else if (type === "forbidden") {
        if (applicantStatus) {
          setApplication(applicantStatus);
        } else {
          setError(t("login.errors.inactiveAccount"));
        }
      } else if (type === "rateLimited") {
        setError(t("login.errors.rateLimited"));
      } else if (type === "network") {
        setError(t("login.errors.network"));
      } else {
        setError(t("login.errors.server"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);

    if (fieldErrors.email) {
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        email: "",
      }));
    }

    if (error) {
      setError("");
    }

    setApplication(null);
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);

    if (fieldErrors.password) {
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        password: "",
      }));
    }

    if (error) {
      setError("");
    }

    setApplication(null);
  }

  function formatApplicationDate(value) {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <header className="border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            aria-label={t("accessibility.home")}
          >
            <Logo
              variant="logo"
              appearance={theme === "dark" ? "dark" : "light"}
              className="h-auto w-24 sm:h-11 sm:w-auto"
              alt={t("accessibility.logoAlt")}
            />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Login */}
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-5 py-10 sm:px-6">
        <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-primary/5 sm:p-8">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
              {t("login.title")}
            </h1>

            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {t("login.description")}
            </p>
          </div>

          {sessionExpired && !error && (
            <Alert tone="info" title={t("login.sessionExpiredTitle")} className="mb-5">
              {t("login.sessionExpiredDescription")}
            </Alert>
          )}

          {/* Error */}
          {error && <Alert tone="error" className="mb-5">{error}</Alert>}

          {application && (
            <section
              aria-live="polite"
              className={`mb-5 rounded-xl border px-4 py-4 text-sm ${
                application.status === "REJECTED"
                  ? "border-danger/25 bg-danger/5"
                  : "border-primary/25 bg-primary/5"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold text-text-primary">
                  {t("login.applicationStatus.title")}
                </h2>
                <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-primary">
                  {t(`login.applicationStatus.status.${application.status}`)}
                </span>
              </div>
              <p className="mt-2 leading-6 text-text-secondary">
                {t(`login.applicationStatus.message.${application.status}`)}
              </p>
              {application.request_type && (
                <p className="mt-3 text-text-primary">
                  <span className="font-medium">
                    {t("login.applicationStatus.applicationType")}: {" "}
                  </span>
                  {t(`login.applicationStatus.type.${application.request_type}`)}
                </p>
              )}
              {formatApplicationDate(application.submitted_at) && (
                <p className="mt-2 text-text-secondary">
                  {t("login.applicationStatus.submitted", {
                    date: formatApplicationDate(application.submitted_at),
                  })}
                </p>
              )}
              {application.status === "REJECTED" && (
                <div className="mt-3 rounded-lg bg-surface/80 p-3 text-text-primary">
                  <p className="font-medium">
                    {t("login.applicationStatus.rejectionReason")}
                  </p>
                  {application.rejection_reason ? (
                    <p className="mt-1 whitespace-pre-wrap leading-6">
                      {application.rejection_reason}
                    </p>
                  ) : (
                    <p className="mt-1 leading-6 text-text-secondary">
                      {t("login.applicationStatus.noRejectionReason")}
                    </p>
                  )}
                </div>
              )}
              {application.reviewed_at && (
                <p className="mt-2 text-text-secondary">
                  {t("login.applicationStatus.reviewed", {
                    date: formatApplicationDate(application.reviewed_at),
                  })}
                </p>
              )}
            </section>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <TextField
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              label={t("login.email")}
              value={email}
              onChange={handleEmailChange}
              placeholder={t("login.emailPlaceholder")}
              disabled={isSubmitting}
              error={fieldErrors.email}
            />
            <TextField
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              label={t("login.password")}
              value={password}
              onChange={handlePasswordChange}
              placeholder={t("login.passwordPlaceholder")}
              disabled={isSubmitting}
              error={fieldErrors.password}
            />
            <Button type="submit" size="lg" fullWidth loading={isSubmitting} loadingText={t("login.submitting")}>
              {t("login.submit")}
            </Button>
          </form>

          {/* Registration */}
          <div className="mt-7 border-t border-border pt-6 text-center">
            <p className="text-sm text-text-secondary">
              {t("login.noAccount")}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              <Link
                to="/register/patient"
                className="font-semibold text-primary transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("login.registerPatient")}
              </Link>

              <Link
                to="/register/doctor"
                className="font-semibold text-primary transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("login.registerDoctor")}
              </Link>

              <Link
                to="/register/ngo"
                className="font-semibold text-primary transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("login.registerOrganization")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;
