import { Alert, Button, Card, DescriptionList, LoadingState, PageHeader, SelectField, StatusBadge, TextareaField, TextField } from "@/presentation/components/ui";

const ANSWER_FIELDS = ["chronic_conditions", "medications", "allergies"];
const ANSWER_LABELS = { chronic_conditions: "chronicConditions", medications: "medications", allergies: "allergies" };

function answerText(t, answer, details) {
  const label = t(`patientWorkspace.answers.${answer}`);
  return answer === "YES" && details ? `${label} — ${details}` : label;
}

// Health information form. Every field has a connected label (UX-12). Once the
// administration starts reviewing, the answers are shown as readable text
// instead of greyed-out fields (UX-18), with a way to request a correction.
function PatientIntakeSection({
  t, intake, form, isLoading, isSaving, error, canEdit,
  correctionRequests, correctionMessage, isCorrectionSubmitting,
  onFieldChange, onSubmit, onCorrectionChange, onCorrectionSubmit,
}) {
  const hint = intake?.status === "SUBMITTED" ? t("patientWorkspace.submittedHint") : intake ? t("patientWorkspace.lockedHint") : t("patientWorkspace.formHint");

  return (
    <div id="patient-intake">
      <PageHeader
        title={t("patientWorkspace.formTitle")}
        actions={<StatusBadge status={intake?.status || "NOT_SUBMITTED"} tone={intake ? undefined : "neutral"} labelPrefix="patientWorkspace.status" />}
      />
      <Alert tone="info" className="mb-6">{hint}</Alert>
      {error && <Alert tone="error" className="mb-6">{error}</Alert>}

      {isLoading ? <LoadingState label={t("patientWorkspace.loading")} />
        : canEdit ? (
          <Card>
            <form onSubmit={onSubmit} className="space-y-6">
              <TextareaField name="current_problem" label={t("patientWorkspace.currentProblem")} value={form.current_problem || ""} onChange={onFieldChange} required maxLength={10000} />
              <TextareaField name="symptoms" label={t("patientWorkspace.symptoms")} value={form.symptoms || ""} onChange={onFieldChange} required maxLength={10000} />
              <TextField name="symptom_onset" label={t("patientWorkspace.onset")} value={form.symptom_onset} onChange={onFieldChange} required maxLength={255} placeholder={t("patientWorkspace.onsetPlaceholder")} />
              {ANSWER_FIELDS.map((name) => (
                <div key={name} className="space-y-3">
                  <SelectField
                    name={`${name}_answer`}
                    label={t(`patientWorkspace.${ANSWER_LABELS[name]}`)}
                    value={form[`${name}_answer`]}
                    onChange={onFieldChange}
                    options={["YES", "NO", "UNKNOWN"].map((value) => ({ value, label: t(`patientWorkspace.answers.${value}`) }))}
                  />
                  {form[`${name}_answer`] === "YES" && (
                    <TextareaField
                      name={`${name}_details`}
                      label={t("patientWorkspace.detailsLabel", { field: t(`patientWorkspace.${ANSWER_LABELS[name]}`) })}
                      value={form[`${name}_details`] || ""}
                      onChange={onFieldChange}
                      required
                      rows={3}
                      maxLength={10000}
                      placeholder={t("patientWorkspace.detailsPlaceholder")}
                    />
                  )}
                </div>
              ))}
              <TextareaField name="additional_information" label={t("patientWorkspace.additionalInformation")} value={form.additional_information || ""} onChange={onFieldChange} maxLength={10000} />
              <Button type="submit" loading={isSaving} loadingText={t("patientWorkspace.saving")}>
                {t(intake ? "patientWorkspace.saveChanges" : "patientWorkspace.submit")}
              </Button>
            </form>
          </Card>
        ) : (
          <Card>
            <DescriptionList
              columns={2}
              items={[
                { label: t("patientWorkspace.currentProblem"), value: form.current_problem },
                { label: t("patientWorkspace.symptoms"), value: form.symptoms },
                { label: t("patientWorkspace.onset"), value: form.symptom_onset },
                ...ANSWER_FIELDS.map((name) => ({ label: t(`patientWorkspace.${ANSWER_LABELS[name]}`), value: answerText(t, form[`${name}_answer`], form[`${name}_details`]) })),
                { label: t("patientWorkspace.additionalInformation"), value: form.additional_information, wide: true },
              ]}
            />
          </Card>
        )}

      {intake && !canEdit && (
        <Card title={t("patientWorkspace.correctionTitle")} description={t("patientWorkspace.correctionHint")} className="mt-8">
          <form onSubmit={onCorrectionSubmit} className="space-y-3">
            <TextareaField
              label={t("patientWorkspace.correctionLabel")}
              required
              maxLength={10000}
              rows={4}
              value={correctionMessage}
              onChange={(event) => onCorrectionChange(event.target.value)}
            />
            <Button type="submit" disabled={!correctionMessage.trim()} loading={isCorrectionSubmitting} loadingText={t("patientWorkspace.saving")}>
              {t("patientWorkspace.sendCorrection")}
            </Button>
          </form>
          {correctionRequests.length > 0 && (
            <div className="mt-6 space-y-3">
              {correctionRequests.map((request) => (
                <article key={request.id} className="rounded-xl border border-border bg-background p-4">
                  <StatusBadge status={request.status} labelPrefix="patientWorkspace.correctionStatus" />
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{request.message}</p>
                  {request.admin_response && (
                    <p className="mt-3 border-t border-border pt-3 text-sm leading-6">
                      <span className="font-semibold">{t("patientWorkspace.adminResponse")}: </span>{request.admin_response}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default PatientIntakeSection;
