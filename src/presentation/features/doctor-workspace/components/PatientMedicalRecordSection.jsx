import { useState } from "react";

const fields = ["blood_type", "allergies", "chronic_diseases", "medical_history", "previous_surgeries"];

function PatientMedicalRecordSection({ t, record, isSaving, onSave }) {
  const [form, setForm] = useState(() => Object.fromEntries(fields.map((field) => [field, record?.[field] || ""])));
  function submit(event) { event.preventDefault(); onSave(form); }
  return <section id="doctor-medical-record" className="rounded-2xl border border-border bg-surface p-6 sm:p-8"><h2 className="text-xl font-bold">{t("doctorWorkspace.medicalRecord")}</h2><p className="mt-2 text-sm text-text-secondary">{t("doctorWorkspace.medicalRecordDescription")}</p><form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">{fields.map((field) => <label key={field} className="text-sm font-semibold">{t(`doctorWorkspace.recordFields.${field}`)}<textarea rows={3} value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-normal" /></label>)}<button type="submit" disabled={isSaving} className="w-fit rounded-xl bg-primary px-6 py-3 font-semibold text-white disabled:opacity-60">{isSaving ? t("doctorWorkspace.saving") : t("doctorWorkspace.saveRecord")}</button></form></section>;
}
export default PatientMedicalRecordSection;
