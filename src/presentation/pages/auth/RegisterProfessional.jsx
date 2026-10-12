import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import LanguageToggle from "@/presentation/components/common/LanguageToggle";
import Logo from "@/presentation/components/common/Logo";
import ThemeToggle from "@/presentation/components/common/ThemeToggle";
import { useTheme } from "@/presentation/context/ThemeContext";
import { normalizeApiError } from "@/presentation/utils/normalizeApiError";
import { useApplicationServices } from "@/app/useApplicationServices";

const roleFields = {
  doctor: [
    { name: "specialization", type: "text", required: true, maxLength: 100 },
    { name: "license_number", type: "text", required: true, maxLength: 100 },
  ],
  ngo: [
    { name: "organization_name", type: "text", required: true, maxLength: 150 },
    { name: "registration_number", type: "text", maxLength: 100 },
    { name: "address", type: "text", maxLength: 255 },
  ],
};

const commonFields = [
  { name: "full_name", type: "text", required: true, maxLength: 150, autoComplete: "name" },
  { name: "email", type: "email", required: true, maxLength: 255, autoComplete: "email" },
  { name: "phone", type: "tel", maxLength: 10, autoComplete: "tel", inputMode: "tel" },
  { name: "password", type: "password", required: true, autoComplete: "new-password", help: true },
  { name: "password_confirmation", type: "password", required: true, autoComplete: "new-password" },
];

const initialForm = {
  full_name: "",
  email: "",
  phone: "",
  specialization: "",
  license_number: "",
  organization_name: "",
  registration_number: "",
  address: "",
  password: "",
  password_confirmation: "",
};

function ProfessionalField({ field, value, error, disabled, onChange, t }) {
  const { name, required, help, ...inputProps } = field;
  const inputId = `professional-${name}`;
  const describedBy = [help && `${inputId}-hint`, error && `${inputId}-error`]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-text-primary">
        {t(`registerProfessional.fields.${name}`)}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        {...inputProps}
        className={`w-full rounded-xl border ${error ? "border-danger" : "border-border"} bg-background px-4 py-3 text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60`}
      />
      {help && <p id={`${inputId}-hint`} className="mt-2 text-xs leading-5 text-text-secondary">{t("registerProfessional.passwordHint")}</p>}
      {error && <p id={`${inputId}-error`} className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

function RegisterProfessional({ role }) {
  const { auth } = useApplicationServices();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const fields = [...commonFields.slice(0, 3), ...roleFields[role], ...commonFields.slice(3)];

  function validate() {
    const errors = {};
    const email = form.email.trim();
    const phone = form.phone.trim();
    const maxLengths = {
      full_name: 150,
      email: 255,
      specialization: 100,
      license_number: 100,
      organization_name: 150,
      registration_number: 100,
      address: 255,
    };

    if (!form.full_name.trim()) errors.full_name = t("registerProfessional.errors.fullNameRequired");
    else if (form.full_name.trim().length > 150) errors.full_name = t("registerProfessional.errors.fullNameTooLong");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = t("registerProfessional.errors.emailInvalid");
    else if (email.length > 255) errors.email = t("registerProfessional.errors.emailTooLong");
    if (phone && !/^(059|056)\d{7}$/.test(phone)) errors.phone = t("registerProfessional.errors.phoneInvalid");

    for (const field of roleFields[role]) {
      const value = form[field.name].trim();
      if (field.required && !value) errors[field.name] = t(`registerProfessional.errors.${field.name}Required`);
      else if (value.length > maxLengths[field.name]) errors[field.name] = t(`registerProfessional.errors.${field.name}TooLong`);
    }

    if (
      form.password.length < 8 ||
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/\d/.test(form.password)
    ) errors.password = t("registerProfessional.errors.passwordPolicy");
    else if (new TextEncoder().encode(form.password).length > 72) errors.password = t("registerProfessional.errors.passwordTooLong");
    if (!form.password_confirmation) errors.password_confirmation = t("registerProfessional.errors.confirmationRequired");
    else if (form.password_confirmation !== form.password) errors.password_confirmation = t("registerProfessional.errors.passwordMismatch");

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      password: form.password,
      password_confirmation: form.password_confirmation,
    };
    const phone = form.phone.trim();
    if (phone) payload.phone = phone;
    for (const field of roleFields[role]) {
      const value = form[field.name].trim();
      if (value) payload[field.name] = value;
    }

    setIsSubmitting(true);
    try {
      await (role === "doctor" ? auth.registerDoctor(payload) : auth.registerNgo(payload));
      setIsRegistered(true);
    } catch (requestError) {
      const normalized = normalizeApiError(requestError);
      if (normalized.type === "validation") {
        const nextErrors = {};
        for (const field of fields) {
          if (normalized.fieldErrors[field.name]) {
            nextErrors[field.name] = t(`registerProfessional.errors.serverFields.${field.name}`);
          }
        }
        setFieldErrors(nextErrors);
        setFormError(t("registerProfessional.errors.validation"));
      } else if (normalized.type === "conflict") setFormError(t(`registerProfessional.errors.${role}Conflict`));
      else if (normalized.type === "network") setFormError(t("registerProfessional.errors.network"));
      else if (normalized.type === "server") setFormError(t("registerProfessional.errors.server"));
      else setFormError(t("registerProfessional.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    if (formError) setFormError("");
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link to="/" className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" aria-label={t("accessibility.home")}>
            <Logo variant="logo" appearance={theme === "dark" ? "dark" : "light"} className="h-auto w-24 sm:h-11 sm:w-auto" alt={t("accessibility.logoAlt")} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3"><LanguageToggle /><ThemeToggle /></div>
        </div>
      </header>

      <main className="px-5 py-10 sm:px-6 sm:py-14">
        <section className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-primary/5 sm:p-8">
          {isRegistered ? (
            <div className="py-5 text-center" role="status">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary" aria-hidden="true">✓</div>
              <h1 className="mt-5 text-2xl font-bold sm:text-3xl">{t(`registerProfessional.success.${role}.title`)}</h1>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-text-secondary">{t("registerProfessional.success.description")}</p>
              <Link to="/login" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{t("registerProfessional.success.login")}</Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold sm:text-3xl">{t(`registerProfessional.${role}.title`)}</h1>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{t("registerProfessional.description")}</p>
              </div>
              {formError && <div role="alert" className="mb-6 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{formError}</div>}
              <form onSubmit={handleSubmit} className="space-y-7" noValidate>
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  {fields.map((field) => <ProfessionalField key={field.name} field={field} value={form[field.name]} error={fieldErrors[field.name]} disabled={isSubmitting} onChange={handleChange} t={t} />)}
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? t("registerProfessional.submitting") : t("registerProfessional.submit")}
                </button>
              </form>
              <p className="mt-7 border-t border-border pt-6 text-center text-sm text-text-secondary">
                {t("registerProfessional.haveAccount")} {" "}
                <Link to="/login" className="font-semibold text-primary transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{t("registerProfessional.login")}</Link>
              </p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default RegisterProfessional;
