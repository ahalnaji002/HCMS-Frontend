import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";

const SETTING_FIELDS = [
  { key: "system_name", kind: "name" },
  { key: "support_email", kind: "email" },
  { key: "support_phone", kind: "phone" },
];

function errorKind(error) {
  if (!error.response) return "network";
  if (error.response.status === 401) return "unauthorized";
  if (error.response.status === 403) return "forbidden";
  if (error.response.status === 404) return "notFound";
  if (error.response.status === 400) return "validation";
  return "server";
}

function loadErrorKind(error) {
  if (!error.response) return "network";
  if (error.response.status === 401) return "unauthorized";
  if (error.response.status === 403) return "forbidden";
  if (error.response.status === 404) return "notFound";
  return "loadFailed";
}

function normalizedValue(field, value) {
  const trimmed = value.trim();
  return field.kind !== "name" && trimmed === "" ? null : trimmed;
}

function validateValue(field, value, t) {
  const normalized = value.trim();
  const length = Array.from(normalized).length;

  if (field.kind === "name") {
    if (!normalized) return t("systemSettings.errors.nameRequired");
    if (length > 100) return t("systemSettings.errors.nameTooLong");
  }

  if (field.kind === "email" && normalized) {
    const atIndex = normalized.indexOf("@");
    const dotIndex = normalized.slice(atIndex + 1).indexOf(".");
    const validEmail = !Array.from(normalized).some((character) => character.trim() === "")
      && atIndex > 0
      && atIndex === normalized.lastIndexOf("@")
      && dotIndex > 0
      && dotIndex < normalized.length - atIndex - 2;
    if (length > 255) return t("systemSettings.errors.emailTooLong");
    if (!validEmail) return t("systemSettings.errors.emailInvalid");
  }

  if (field.kind === "phone" && normalized && !/^(059|056)\d{7}$/.test(normalized)) {
    return t("systemSettings.errors.phoneInvalid");
  }

  return "";
}

function formatUpdatedAt(value, locale) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale || undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function SystemSettingsFeature() {
  const { t, i18n } = useTranslation();
  const { admin } = useApplicationServices();
  const [settings, setSettings] = useState({});
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    admin.listSystemSettings()
      .then((response) => {
        if (!active) return;
        const approved = Object.fromEntries(
          (response?.data?.settings ?? [])
            .filter((setting) => SETTING_FIELDS.some((field) => field.key === setting.setting_key))
            .map((setting) => [setting.setting_key, setting]),
        );
        setSettings(approved);
        setValues(Object.fromEntries(SETTING_FIELDS.map(({ key }) => [key, approved[key]?.setting_value ?? ""])));
        setLoadError("");
      })
      .catch((error) => {
        if (active) setLoadError(loadErrorKind(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [admin, reloadKey]);

  function retry() {
    setLoading(true);
    setLoadError("");
    setReloadKey((current) => current + 1);
  }

  function changeValue(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: "" }));
    setNotice("");
  }

  async function save(field) {
    const value = values[field.key] ?? "";
    const validationError = validateValue(field, value, t);
    if (validationError) {
      setFormErrors((current) => ({ ...current, [field.key]: validationError }));
      setNotice("");
      return;
    }

    setSavingKey(field.key);
    setFormErrors((current) => ({ ...current, [field.key]: "" }));
    setNotice("");
    try {
      const response = await admin.updateSystemSetting(field.key, normalizedValue(field, value));
      const updated = response?.data?.setting;
      if (updated) {
        setSettings((current) => ({ ...current, [field.key]: updated }));
        setValues((current) => ({ ...current, [field.key]: updated.setting_value ?? "" }));
      }
      setNotice("saved");
    } catch (error) {
      setFormErrors((current) => ({ ...current, [field.key]: t(`systemSettings.errors.${errorKind(error)}`) }));
    } finally {
      setSavingKey("");
    }
  }

  return (
    <section aria-labelledby="system-settings-title" className="mx-auto max-w-4xl">
      <header className="mb-7">
        <p className="text-sm font-semibold text-primary">{t("systemSettings.eyebrow")}</p>
        <h1 id="system-settings-title" className="mt-2 text-3xl font-bold">{t("roleNavigation.admin.settings")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">{t("systemSettings.description")}</p>
      </header>

      {notice && <p role="status" className="mb-5 rounded-xl bg-primary/10 p-4 text-sm text-primary">{t(`systemSettings.notices.${notice}`)}</p>}

      {loading ? <p role="status" className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-secondary">{t("systemSettings.loading")}</p>
        : loadError ? <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
          <p>{t(`systemSettings.errors.${loadError}`)}</p>
          <button type="button" onClick={retry} className="mt-4 min-h-10 rounded-lg border border-current px-4 py-2 font-semibold">{t("systemSettings.retry")}</button>
        </div>
          : <div className="grid gap-5">{SETTING_FIELDS.map((field) => {
            const setting = settings[field.key];
            const unavailable = !setting;
            const error = formErrors[field.key];
            const id = `system-setting-${field.key}`;
            return <article key={field.key} className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
              <div className="mb-5">
                <h2 id={`${id}-title`} className="text-lg font-bold">{t(`systemSettings.fields.${field.key}.label`)}</h2>
                <p className="mt-1 text-sm leading-6 text-text-secondary">{t(`systemSettings.fields.${field.key}.description`)}</p>
              </div>
              <form noValidate onSubmit={(event) => { event.preventDefault(); save(field); }} aria-labelledby={`${id}-title`}>
                <label htmlFor={id} className="mb-2 block text-sm font-semibold">{t("systemSettings.valueLabel")}</label>
                <input
                  id={id}
                  name="setting_value"
                  type={field.kind === "email" ? "email" : "text"}
                  inputMode={field.kind === "phone" ? "numeric" : undefined}
                  maxLength={field.kind === "name" ? 100 : field.kind === "email" ? 255 : 10}
                  value={values[field.key] ?? ""}
                  onChange={(event) => changeValue(field.key, event.target.value)}
                  disabled={unavailable || Boolean(savingKey)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : undefined}
                  className="min-h-12 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm disabled:opacity-60"
                />
                {error && <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-danger">{error}</p>}
                {setting?.updated_at && <p className="mt-3 text-xs text-text-secondary">{t("systemSettings.updatedAt", { date: formatUpdatedAt(setting.updated_at, i18n.language) })}</p>}
                {unavailable && <p className="mt-3 text-sm text-text-secondary">{t("systemSettings.unavailable")}</p>}
                <button type="submit" disabled={unavailable || Boolean(savingKey)} className="mt-5 min-h-11 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                  {savingKey === field.key ? t("systemSettings.saving") : t("systemSettings.save")}
                </button>
              </form>
            </article>;
          })}</div>}
    </section>
  );
}

export default SystemSettingsFeature;
