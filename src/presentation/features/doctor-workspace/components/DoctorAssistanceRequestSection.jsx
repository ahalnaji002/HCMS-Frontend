import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";

function errorMessage(error, t) {
  const status = error.response?.status;
  if (status === 400) return t("doctorAssistanceRequest.errors.validation");
  if (status === 401) return t("doctorAssistanceRequest.errors.unauthorized");
  if (status === 404) return t("doctorAssistanceRequest.errors.notFound");
  if (status === 409) return t("doctorAssistanceRequest.errors.conflict");
  if (status >= 500) return t("doctorAssistanceRequest.errors.server");
  if (!error.response) return t("doctorAssistanceRequest.errors.network");
  return t("doctorAssistanceRequest.errors.unknown");
}

function validationMessage(field, message, t) {
  const keyByField = {
    request_type: {
      "request_type is required": "requestTypeRequired",
      "request_type must not be empty": "requestTypeRequired",
      "request_type must not exceed 100 characters": "requestTypeTooLong",
    },
    description: {
      "description is required": "descriptionRequired",
      "description must not be empty": "descriptionRequired",
      "description must not exceed 65535 bytes": "descriptionTooLong",
    },
  };
  const key = keyByField[field]?.[message];
  return key ? t(`doctorAssistanceRequest.errors.${key}`) : null;
}

function DoctorAssistanceRequestSection({ patient, onAccessDenied }) {
  const { t } = useTranslation();
  const { doctorWorkspace } = useApplicationServices();
  const [form, setForm] = useState({ request_type: "", description: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createdRequest, setCreatedRequest] = useState(null);
  const [saving, setSaving] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setError("");
    setNotice("");
  }

  async function submit(event) {
    event.preventDefault();
    const payload = {
      request_type: form.request_type.trim(),
      description: form.description.trim(),
    };
    const localErrors = {};
    if (!payload.request_type) localErrors.request_type = t("doctorAssistanceRequest.errors.requestTypeRequired");
    else if (payload.request_type.length > 100) localErrors.request_type = t("doctorAssistanceRequest.errors.requestTypeTooLong");
    if (!payload.description) localErrors.description = t("doctorAssistanceRequest.errors.descriptionRequired");
    else if (new TextEncoder().encode(payload.description).length > 65535) localErrors.description = t("doctorAssistanceRequest.errors.descriptionTooLong");
    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors);
      return;
    }

    setSaving(true);
    setFieldErrors({});
    setError("");
    setNotice("");
    try {
      const response = await doctorWorkspace.createPatientAssistanceRequest(patient.id, payload);
      const request = response.data.assistance_request;
      setCreatedRequest(request);
      setForm({ request_type: "", description: "" });
      setNotice(t("doctorAssistanceRequest.created"));
    } catch (requestError) {
      if (requestError.response?.status === 403) {
        onAccessDenied();
        return;
      }
      const errors = requestError.response?.data?.errors;
      if (requestError.response?.status === 400 && errors && typeof errors === "object") {
        const nextErrors = {};
        for (const field of ["request_type", "description"]) {
          const message = errors[field];
          if (typeof message === "string") nextErrors[field] = validationMessage(field, message, t);
        }
        setFieldErrors(nextErrors);
      }
      setError(errorMessage(requestError, t));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="doctor-assistance-request" className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="text-xl font-bold">{t("doctorAssistanceRequest.title")}</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{t("doctorAssistanceRequest.description", { patientName: patient.full_name })}</p>

      {error && <p role="alert" className="mt-5 rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl bg-primary/10 p-4 text-sm text-primary">{notice}</p>}

      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <label className="block text-sm font-semibold">
          {t("doctorAssistanceRequest.fields.requestType")}
          <input name="request_type" required maxLength={100} value={form.request_type} onChange={updateField} aria-invalid={Boolean(fieldErrors.request_type)} aria-describedby={fieldErrors.request_type ? "assistance-request-type-error" : undefined} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" />
          {fieldErrors.request_type && <span id="assistance-request-type-error" className="mt-1 block text-xs font-normal text-danger">{fieldErrors.request_type}</span>}
        </label>
        <label className="block text-sm font-semibold">
          {t("doctorAssistanceRequest.fields.description")}
          <textarea name="description" required rows={4} value={form.description} onChange={updateField} aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? "assistance-request-description-error" : undefined} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" />
          {fieldErrors.description && <span id="assistance-request-description-error" className="mt-1 block text-xs font-normal text-danger">{fieldErrors.description}</span>}
        </label>
        <button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          {saving ? t("doctorAssistanceRequest.submitting") : t("doctorAssistanceRequest.submit")}
        </button>
      </form>

      {createdRequest && <div className="mt-6 rounded-xl border border-border bg-background p-4" aria-live="polite">
        <h3 className="font-bold">{t("doctorAssistanceRequest.latestRequest")}</h3>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold">{t("doctorAssistanceRequest.fields.requestType")}</dt><dd className="mt-1 text-text-secondary">{createdRequest.request_type}</dd></div>
          <div><dt className="font-semibold">{t("doctorAssistanceRequest.status")}</dt><dd className="mt-1 text-text-secondary">{t(`doctorAssistanceRequest.statuses.${createdRequest.status}`, { defaultValue: createdRequest.status })}</dd></div>
          <div className="sm:col-span-2"><dt className="font-semibold">{t("doctorAssistanceRequest.fields.description")}</dt><dd className="mt-1 whitespace-pre-wrap text-text-secondary">{createdRequest.description}</dd></div>
        </dl>
      </div>}
    </section>
  );
}

export default DoctorAssistanceRequestSection;
