function PatientIntakeSection({
  t, intake, form, isLoading, isSaving, error, notice, canEdit, statusLabel,
  correctionError, correctionNotice, correctionRequests, correctionMessage,
  isCorrectionSubmitting, onFieldChange, onSubmit, onCorrectionChange,
  onCorrectionSubmit,
}) {
  return (
    <section id="patient-intake" className="rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-primary/5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("patientWorkspace.formTitle")}</h2>
        <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">{statusLabel}</span>
      </div>
      <div className="mb-6 rounded-xl border border-border bg-background p-4 text-sm leading-6 text-text-secondary">
        {intake?.status === "SUBMITTED" ? t("patientWorkspace.submittedHint") : intake ? t("patientWorkspace.lockedHint") : t("patientWorkspace.formHint")}
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl bg-primary/10 p-4 text-sm text-primary">{notice}</p>}
      {isLoading ? <p className="py-8 text-center text-text-secondary">{t("patientWorkspace.loading")}</p> : (
        <form onSubmit={onSubmit} className="space-y-6">
          <TextArea name="current_problem" label={t("patientWorkspace.currentProblem")} value={form.current_problem} onChange={onFieldChange} disabled={!canEdit} required />
          <TextArea name="symptoms" label={t("patientWorkspace.symptoms")} value={form.symptoms} onChange={onFieldChange} disabled={!canEdit} required />
          <Field label={t("patientWorkspace.onset")}>
            <input name="symptom_onset" value={form.symptom_onset} onChange={onFieldChange} disabled={!canEdit} required maxLength={255} placeholder={t("patientWorkspace.onsetPlaceholder")} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-primary disabled:opacity-70" />
          </Field>
          <AnswerField name="chronic_conditions" label={t("patientWorkspace.chronicConditions")} answer={form.chronic_conditions_answer} details={form.chronic_conditions_details} onChange={onFieldChange} disabled={!canEdit} t={t} />
          <AnswerField name="medications" label={t("patientWorkspace.medications")} answer={form.medications_answer} details={form.medications_details} onChange={onFieldChange} disabled={!canEdit} t={t} />
          <AnswerField name="allergies" label={t("patientWorkspace.allergies")} answer={form.allergies_answer} details={form.allergies_details} onChange={onFieldChange} disabled={!canEdit} t={t} />
          <TextArea name="additional_information" label={t("patientWorkspace.additionalInformation")} value={form.additional_information || ""} onChange={onFieldChange} disabled={!canEdit} />
          {canEdit && <button type="submit" disabled={isSaving} className="rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60">{isSaving ? t("patientWorkspace.saving") : t(intake ? "patientWorkspace.saveChanges" : "patientWorkspace.submit")}</button>}
        </form>
      )}
      {intake && !canEdit && (
        <div className="mt-8 border-t border-border pt-6">
          <h3 className="text-lg font-bold">{t("patientWorkspace.correctionTitle")}</h3>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{t("patientWorkspace.correctionHint")}</p>
          {correctionError && <p role="alert" className="mt-4 rounded-xl bg-danger/10 p-4 text-sm text-danger">{correctionError}</p>}
          {correctionNotice && <p role="status" className="mt-4 rounded-xl bg-primary/10 p-4 text-sm text-primary">{correctionNotice}</p>}
          <form onSubmit={onCorrectionSubmit} className="mt-4 space-y-3">
            <textarea required maxLength={10000} rows={4} value={correctionMessage} onChange={(event) => onCorrectionChange(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3" />
            <button type="submit" disabled={isCorrectionSubmitting} className="rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">{isCorrectionSubmitting ? t("patientWorkspace.saving") : t("patientWorkspace.sendCorrection")}</button>
          </form>
          {correctionRequests.length > 0 && <div className="mt-6 space-y-3">{correctionRequests.map((request) => <article key={request.id} className="rounded-xl border border-border bg-background p-4"><p className="text-xs font-semibold text-text-secondary">{t(`patientWorkspace.correctionStatus.${request.status}`)}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{request.message}</p>{request.admin_response && <p className="mt-3 border-t border-border pt-3 text-sm leading-6"><span className="font-semibold">{t("patientWorkspace.adminResponse")}: </span>{request.admin_response}</p>}</article>)}</div>}
        </div>
      )}
    </section>
  );
}

function Field({ label, children }) {
  return <div className="space-y-2"><span className="block text-sm font-semibold">{label}</span>{children}</div>;
}

function TextArea({ name, label, value, onChange, disabled, required = false }) {
  return <Field label={label}><textarea name={name} value={value || ""} onChange={onChange} disabled={disabled} required={required} maxLength={10000} rows={4} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-primary disabled:opacity-70" /></Field>;
}

function AnswerField({ name, label, answer, details, onChange, disabled, t }) {
  const answerName = `${name}_answer`;
  const detailsName = `${name}_details`;
  return (
    <Field label={label}>
      <select name={answerName} value={answer} onChange={onChange} disabled={disabled} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-primary disabled:opacity-70">
        <option value="YES">{t("patientWorkspace.answers.YES")}</option><option value="NO">{t("patientWorkspace.answers.NO")}</option><option value="UNKNOWN">{t("patientWorkspace.answers.UNKNOWN")}</option>
      </select>
      {answer === "YES" && <textarea name={detailsName} value={details || ""} onChange={onChange} disabled={disabled} required maxLength={10000} rows={3} placeholder={t("patientWorkspace.detailsPlaceholder")} className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-text-primary disabled:opacity-70" />}
    </Field>
  );
}

export default PatientIntakeSection;
