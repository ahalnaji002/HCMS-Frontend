import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { Button, Card, ErrorState, LoadingState, PageHeader, TextField, useToast } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";

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

function SystemSettingsFeature() {
  const { t } = useTranslation();
  const { admin } = useApplicationServices();
  const toast = useToast();
  const { dateTime } = useFormatDate();
  const [settings, setSettings] = useState({});
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [formErrors, setFormErrors] = useState({});
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
  }

  async function save(field) {
    const value = values[field.key] ?? "";
    const validationError = validateValue(field, value, t);
    if (validationError) {
      setFormErrors((current) => ({ ...current, [field.key]: validationError }));
      return;
    }

    setSavingKey(field.key);
    setFormErrors((current) => ({ ...current, [field.key]: "" }));
    try {
      const response = await admin.updateSystemSetting(field.key, normalizedValue(field, value));
      const updated = response?.data?.setting;
      if (updated) {
        setSettings((current) => ({ ...current, [field.key]: updated }));
        setValues((current) => ({ ...current, [field.key]: updated.setting_value ?? "" }));
      }
      toast.success({ key: "systemSettings.notices.saved" });
    } catch (error) {
      setFormErrors((current) => ({ ...current, [field.key]: t(`systemSettings.errors.${errorKind(error)}`) }));
    } finally {
      setSavingKey("");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow={t("systemSettings.eyebrow")} title={t("roleNavigation.admin.settings")} description={t("systemSettings.description")} />

      {loading ? <LoadingState label={t("systemSettings.loading")} />
        : loadError ? <ErrorState message={t(`systemSettings.errors.${loadError}`)} onRetry={retry} retryLabel={t("systemSettings.retry")} />
          : (
            <div className="grid gap-5">
              {SETTING_FIELDS.map((field) => {
                const setting = settings[field.key];
                const unavailable = !setting;
                return (
                  <Card key={field.key} as="article" title={t(`systemSettings.fields.${field.key}.label`)} description={t(`systemSettings.fields.${field.key}.description`)}>
                    <form noValidate onSubmit={(event) => { event.preventDefault(); save(field); }}>
                      <TextField
                        label={t("systemSettings.valueLabel")}
                        name="setting_value"
                        type={field.kind === "email" ? "email" : "text"}
                        inputMode={field.kind === "phone" ? "numeric" : undefined}
                        maxLength={field.kind === "name" ? 100 : field.kind === "email" ? 255 : 10}
                        value={values[field.key] ?? ""}
                        onChange={(event) => changeValue(field.key, event.target.value)}
                        disabled={unavailable || Boolean(savingKey)}
                        error={formErrors[field.key]}
                        hint={setting?.updated_at ? t("systemSettings.updatedAt", { date: dateTime(setting.updated_at) }) : undefined}
                      />
                      {unavailable && <p className="mt-3 text-sm text-text-secondary">{t("systemSettings.unavailable")}</p>}
                      <Button type="submit" className="mt-5" disabled={unavailable || Boolean(savingKey)} loading={savingKey === field.key} loadingText={t("systemSettings.saving")}>
                        {t("systemSettings.save")}
                      </Button>
                    </form>
                  </Card>
                );
              })}
            </div>
          )}
    </div>
  );
}

export default SystemSettingsFeature;
