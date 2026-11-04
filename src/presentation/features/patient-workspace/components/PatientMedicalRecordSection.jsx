function PatientMedicalRecordSection({ t, record, loading, absent, error, onRetry }) {
  const fields = ["blood_type", "allergies", "chronic_diseases", "medical_history", "previous_surgeries"];

  return (
    <section id="patient-medical-record" className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="text-xl font-bold">{t("patientWorkspace.medicalRecord.title")}</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{t("patientWorkspace.medicalRecord.description")}</p>

      {loading && <p role="status" className="mt-5 text-sm text-text-secondary">{t("patientWorkspace.medicalRecord.loading")}</p>}

      {!loading && error && <div role="alert" className="mt-5 rounded-xl bg-danger/10 p-4 text-sm text-danger">
        <p>{error}</p>
        <button type="button" onClick={onRetry} disabled={loading} className="mt-3 min-h-10 rounded-lg border border-danger px-3 py-2 font-semibold disabled:opacity-60">{t("patientWorkspace.retry")}</button>
      </div>}

      {!loading && !error && absent && <div className="mt-5 rounded-xl border border-border bg-background p-4 text-sm text-text-secondary">
        <p>{t("patientWorkspace.medicalRecord.absent")}</p>
        <button type="button" onClick={onRetry} disabled={loading} className="mt-3 min-h-10 rounded-lg border border-border px-3 py-2 font-semibold text-text-primary disabled:opacity-60">{t("patientWorkspace.medicalRecord.reload")}</button>
      </div>}

      {!loading && !error && record && <>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {fields.map((field) => <div key={field} className="rounded-xl border border-border bg-background p-4">
            <dt className="text-xs font-semibold text-text-secondary">{t(`patientWorkspace.medicalRecord.fields.${field}`)}</dt>
            <dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{record[field] || t("patientWorkspace.medicalRecord.notProvided")}</dd>
          </div>)}
        </dl>
        <button type="button" onClick={onRetry} disabled={loading} className="mt-5 min-h-10 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text-primary disabled:opacity-60">{t("patientWorkspace.medicalRecord.refresh")}</button>
      </>}
    </section>
  );
}

export default PatientMedicalRecordSection;
