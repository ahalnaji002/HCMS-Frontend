import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Logo from "../../components/common/Logo";
import LanguageToggle from "../../components/common/LanguageToggle";
import ThemeToggle from "../../components/common/ThemeToggle";

import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { login } from "../../services/auth";
import { normalizeApiError } from "../../services/apiError";
import { roleRoutes } from "../../services/roleRoutes";

function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { startSession } = useAuth();
  const { theme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await login({
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
      navigate(destination, { replace: true });
    } catch (requestError) {
      const { type } = normalizeApiError(requestError);

      if (type === "validation") {
        setError(t("login.errors.invalidRequest"));
      } else if (type === "unauthorized") {
        setError(t("login.errors.invalidCredentials"));
      } else if (type === "forbidden") {
        setError(t("login.errors.inactiveAccount"));
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

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-text-primary"
              >
                {t("login.email")}
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                placeholder={t("login.emailPlaceholder")}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={
                  fieldErrors.email ? "email-error" : undefined
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
              />

              {fieldErrors.email && (
                <p id="email-error" className="mt-2 text-sm text-danger">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-text-primary"
              >
                {t("login.password")}
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={handlePasswordChange}
                placeholder={t("login.passwordPlaceholder")}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? "password-error" : undefined
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
              />

              {fieldErrors.password && (
                <p id="password-error" className="mt-2 text-sm text-danger">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? t("login.submitting")
                : t("login.submit")}
            </button>
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
