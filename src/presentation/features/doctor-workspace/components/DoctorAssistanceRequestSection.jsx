import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { Button, Card, DescriptionList, TextareaField, TextField, useToast } from "@/presentation/components/ui";

function errorKey(error) {
  const status = error.response?.status;
  if (status === 400) return "doctorAssistanceRequest.errors.validation";
  if (status === 401) return "doctorAssistanceRequest.errors.unauthorized";
  if (status === 404) return "doctorAssistanceRequest.errors.notFound";
  if (status === 409) return "doctorAssistanceRequest.errors.conflict";
  if (status >= 500) return "doctorAssistanceRequest.errors.server";
  if (!error.response) return "doctorAssistanceRequest.errors.network";
  return "doctorAssistanceRequest.errors.unknown";
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
  const toast = useToast();
  const [form, setForm] = useState({ request_type: "", description: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [createdRequest, setCreatedRequest] = useState(null);
  const [saving, setSaving] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
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
    try {
      const response = await doctorWorkspace.createPatientAssistanceRequest(patient.id, payload);
      const request = response.data.assistance_request;
      setCreatedRequest(request);
      setForm({ request_type: "", description: "" });
      toast.success({ key: "doctorAssistanceRequest.created" });
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
      toast.error({ key: errorKey(requestError) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      id="doctor-assistance-request"
      title={t("doctorAssistanceRequest.title")}
      description={t("doctorAssistanceRequest.description", { patientName: patient.full_name })}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <TextField
          label={t("doctorAssistanceRequest.fields.requestType")}
          name="request_type"
          required
          maxLength={100}
          value={form.request_type}
          onChange={updateField}
          error={fieldErrors.request_type}
        />
        <TextareaField
          label={t("doctorAssistanceRequest.fields.description")}
          name="description"
          required
          rows={4}
          value={form.description}
          onChange={updateField}
          error={fieldErrors.description}
        />
        <Button type="submit" loading={saving} loadingText={t("doctorAssistanceRequest.submitting")}>
          {t("doctorAssistanceRequest.submit")}
        </Button>
      </form>

      {createdRequest && (
        <div className="mt-6 border-t border-border pt-5" aria-live="polite">
          <h3 className="font-bold">{t("doctorAssistanceRequest.latestRequest")}</h3>
          <DescriptionList
            className="mt-3"
            columns={2}
            items={[
              { label: t("doctorAssistanceRequest.fields.requestType"), value: createdRequest.request_type },
              { label: t("doctorAssistanceRequest.status"), value: t(`doctorAssistanceRequest.statuses.${createdRequest.status}`, { defaultValue: createdRequest.status }) },
              { label: t("doctorAssistanceRequest.fields.description"), value: createdRequest.description, wide: true },
            ]}
          />
        </div>
      )}
    </Card>
  );
}

export default DoctorAssistanceRequestSection;
