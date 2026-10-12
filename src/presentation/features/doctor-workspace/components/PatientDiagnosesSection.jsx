import MedicalInfoField from "@/presentation/features/doctor-workspace/components/MedicalInfoField";

function PatientDiagnosesSection({ t, diagnoses, value, onChange, isSaving, onSubmit }) {
  return (
    <section id="doctor-diagnoses" className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="text-xl font-bold">{t("doctorWorkspace.diagnosesTitle")}</h2>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <label className="block space-y-2 text-sm font-semibold">{t("doctorWorkspace.diagnosisLabel")}<textarea required rows={4} maxLength={10000} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 font-normal" /></label>
        <button type="submit" disabled={isSaving || !value.trim()} className="rounded-xl bg-primary px-6 py-3 font-semibold text-white disabled:opacity-60">{isSaving ? t("doctorWorkspace.saving") : t("doctorWorkspace.saveDiagnosis")}</button>
      </form>
      <div className="mt-6 space-y-3">{diagnoses.length ? diagnoses.map((diagnosis) => <MedicalInfoField key={diagnosis.id} label={`${diagnosis.doctor_name} · ${diagnosis.specialization} · ${new Date(diagnosis.documented_at).toLocaleString()}`} value={diagnosis.diagnosis} />) : <p className="text-sm text-text-secondary">{t("doctorWorkspace.noDiagnoses")}</p>}</div>
    </section>
  );
}

export default PatientDiagnosesSection;
