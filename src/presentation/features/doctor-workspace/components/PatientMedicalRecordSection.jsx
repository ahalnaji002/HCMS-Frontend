import { useState } from "react";
import { Button, Card, TextareaField } from "@/presentation/components/ui";

const fields = ["blood_type", "allergies", "chronic_diseases", "medical_history", "previous_surgeries"];

const fromRecord = (record) => Object.fromEntries(fields.map((field) => [field, record?.[field] || ""]));

// Saving is only possible when something actually changed, so an empty form
// can no longer create an empty record (UX-03).
function PatientMedicalRecordSection({ t, record, isSaving, onSave }) {
  const [saved, setSaved] = useState(() => fromRecord(record));
  const [form, setForm] = useState(saved);
  const changed = fields.some((field) => form[field].trim() !== saved[field].trim());

  async function submit(event) {
    event.preventDefault();
    if (!changed) return;
    const payload = Object.fromEntries(fields.map((field) => [field, form[field].trim()]));
    if (await onSave(payload)) setSaved(payload);
  }

  return (
    <Card id="doctor-medical-record" title={t("doctorWorkspace.medicalRecord")} description={t("doctorWorkspace.medicalRecordDescription")}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <TextareaField
            key={field}
            label={t(`doctorWorkspace.recordFields.${field}`)}
            rows={3}
            value={form[field]}
            onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
          />
        ))}
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={!changed} loading={isSaving} loadingText={t("doctorWorkspace.saving")}>
            {t("doctorWorkspace.saveRecord")}
          </Button>
          {!changed && <p className="text-sm text-text-secondary">{t("doctorWorkspace.noRecordChanges")}</p>}
        </div>
      </form>
    </Card>
  );
}

export default PatientMedicalRecordSection;
