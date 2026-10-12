import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import LanguageToggle from "@/presentation/components/common/LanguageToggle";
import Logo from "@/presentation/components/common/Logo";
import ThemeToggle from "@/presentation/components/common/ThemeToggle";
import { useTheme } from "@/presentation/context/ThemeContext";
import { normalizeApiError } from "@/presentation/utils/normalizeApiError";
import { useApplicationServices } from "@/app/useApplicationServices";

const fields = [
  {
    name: "full_name",
    type: "text",
    autoComplete: "name",
    required: true,
    maxLength: 150,
  },
  {
    name: "email",
    type: "email",
    autoComplete: "email",
    required: true,
    maxLength: 255,
  },
  {
    name: "phone",
    type: "tel",
    autoComplete: "tel",
    inputMode: "tel",
    maxLength: 10,
  },
  {
    name: "national_id",
    type: "text",
    inputMode: "numeric",
    maxLength: 9,
    required: true,
  },
  { name: "date_of_birth", type: "date", required: true },
  { name: "gender", type: "select", required: true },
  {
    name: "address",
    type: "text",
    autoComplete: "street-address",
    maxLength: 255,
  },
  {
    name: "password",
    type: "password",
    autoComplete: "new-password",
    required: true,
    help: true,
  },
  {
    name: "password_confirmation",
    type: "password",
    autoComplete: "new-password",
    required: true,
  },
];

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  national_id: "",
  date_of_birth: "",
  gender: "",
  address: "",
  password: "",
  password_confirmation: "",
};

const fieldNames = fields.map(({ name }) => name);

function getTodayDateOnly() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isValidDateOnly(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  );
}

function getBackendFieldMessage(value) {
  if (Array.isArray(value)) {
    return value.filter((message) => typeof message === "string").join(" ");
  }

  return typeof value === "string" ? value : "";
}

function PatientField({ field, value, error, isSubmitting, onChange, t }) {
  const { name, type, required, help, ...inputProps } = field;
  const inputId = `patient-${name}`;
  const descriptionIds = [];

  if (help) {
    descriptionIds.push(`${inputId}-hint`);
  }

  if (error) {
    descriptionIds.push(`${inputId}-error`);
  }

  const commonProps = {
    id: inputId,
    name,
    value,
    onChange,
    required,
    disabled: isSubmitting,
    "aria-invalid": Boolean(error),
    "aria-describedby": descriptionIds.length
      ? descriptionIds.join(" ")
      : undefined,
    className: `w-full rounded-xl border ${
      error ? "border-danger" : "border-border"
    } bg-background px-4 py-3 text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60`,
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-medium text-text-primary"
      >
        {t(`registerPatient.fields.${name}`)}
        {required && <span aria-hidden="true"> *</span>}
      </label>

      {type === "select" ? (
        <select {...commonProps}>
          <option value="">{t("registerPatient.fields.genderPlaceholder")}</option>
          <option value="MALE">{t("registerPatient.fields.male")}</option>
          <option value="FEMALE">{t("registerPatient.fields.female")}</option>
        </select>
      ) : (
        <input
          {...commonProps}
          type={type}
          {...inputProps}
          {...(name === "date_of_birth" ? { max: getTodayDateOnly() } : {})}
        />
      )}

      {help && (
        <p
          id={`${inputId}-hint`}
          className="mt-2 text-xs leading-5 text-text-secondary"
        >
          {t("registerPatient.passwordHint")}
        </p>
      )}

      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function RegisterPatient() {
  const { auth } = useApplicationServices();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [formData, setFormData] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  function validateForm() {
    const errors = {};
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const address = formData.address.trim();

    if (!formData.full_name.trim()) {
      errors.full_name = t("registerPatient.errors.fullNameRequired");
    } else if (formData.full_name.trim().length > 150) {
      errors.full_name = t("registerPatient.errors.fullNameTooLong");
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t("registerPatient.errors.emailInvalid");
    } else if (email.length > 255) {
      errors.email = t("registerPatient.errors.emailTooLong");
    }

    if (phone && !/^(059|056)\d{7}$/.test(phone)) {
      errors.phone = t("registerPatient.errors.phoneInvalid");
    }

    if (!/^[1-9]\d{8}$/.test(formData.national_id)) {
      errors.national_id = t("registerPatient.errors.nationalIdInvalid");
    }

    if (!formData.date_of_birth || !isValidDateOnly(formData.date_of_birth)) {
      errors.date_of_birth = t("registerPatient.errors.dateInvalid");
    } else if (formData.date_of_birth > getTodayDateOnly()) {
      errors.date_of_birth = t("registerPatient.errors.dateFuture");
    }

    if (!["MALE", "FEMALE"].includes(formData.gender)) {
      errors.gender = t("registerPatient.errors.genderRequired");
    }

    if (
      formData.password.length < 8 ||
      !/[A-Z]/.test(formData.password) ||
      !/[a-z]/.test(formData.password) ||
      !/\d/.test(formData.password)
    ) {
      errors.password = t("registerPatient.errors.passwordPolicy");
    } else if (new TextEncoder().encode(formData.password).length > 72) {
      errors.password = t("registerPatient.errors.passwordTooLong");
    }

    if (!formData.password_confirmation) {
      errors.password_confirmation = t(
        "registerPatient.errors.confirmationRequired",
      );
    } else if (formData.password_confirmation !== formData.password) {
      errors.password_confirmation = t(
        "registerPatient.errors.passwordMismatch",
      );
    }

    if (address.length > 255) {
      errors.address = t("registerPatient.errors.addressTooLong");
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!validateForm()) {
      return;
    }

    const payload = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      national_id: formData.national_id,
      date_of_birth: formData.date_of_birth,
      gender: formData.gender,
    };
    const phone = formData.phone.trim();
    const address = formData.address.trim();

    if (phone) {
      payload.phone = phone;
    }

    if (address) {
      payload.address = address;
    }

    setIsSubmitting(true);

    try {
      await auth.registerPatient(payload);
      setIsRegistered(true);
    } catch (requestError) {
      const normalizedError = normalizeApiError(requestError);

      if (normalizedError.type === "validation") {
        const serverFieldErrors = {};

        for (const name of fieldNames) {
          const message = getBackendFieldMessage(
            normalizedError.fieldErrors[name],
          );

          if (message) {
            serverFieldErrors[name] = t(
              `registerPatient.errors.serverFields.${name}`,
            );
          }
        }

        setFieldErrors(serverFieldErrors);
        setFormError(t("registerPatient.errors.validation"));
      } else if (normalizedError.type === "conflict") {
        setFormError(t("registerPatient.errors.conflict"));
      } else if (normalizedError.type === "network") {
        setFormError(t("registerPatient.errors.network"));
      } else if (normalizedError.type === "server") {
        setFormError(t("registerPatient.errors.server"));
      } else {
        setFormError(t("registerPatient.errors.generic"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({ ...currentData, [name]: value }));
    setFieldErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));

    if (formError) {
      setFormError("");
    }
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
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

      <main className="px-5 py-10 sm:px-6 sm:py-14">
        <section className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-primary/5 sm:p-8">
          {isRegistered ? (
            <div className="py-5 text-center" role="status">
              <div
                className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary"
                aria-hidden="true"
              >
                ✓
              </div>
              <h1 className="mt-5 text-2xl font-bold sm:text-3xl">
                {t("registerPatient.success.title")}
              </h1>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-text-secondary">
                {t("registerPatient.success.description")}
              </p>
              <Link
                to="/login"
                className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("registerPatient.success.login")}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  {t("registerPatient.title")}
                </h1>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {t("registerPatient.description")}
                </p>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-7" noValidate>
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  {fields.map((field) => (
                    <PatientField
                      key={field.name}
                      field={field}
                      value={formData[field.name]}
                      error={fieldErrors[field.name]}
                      isSubmitting={isSubmitting}
                      onChange={handleChange}
                      t={t}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? t("registerPatient.submitting")
                    : t("registerPatient.submit")}
                </button>
              </form>

              <p className="mt-7 border-t border-border pt-6 text-center text-sm text-text-secondary">
                {t("registerPatient.haveAccount")} {" "}
                <Link
                  to="/login"
                  className="font-semibold text-primary transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {t("registerPatient.login")}
                </Link>
              </p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default RegisterPatient;
