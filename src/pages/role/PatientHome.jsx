import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import RoleLayout from "../../layouts/RoleLayout";
import {
  getPatientIntake,
  submitPatientIntake,
  updatePatientIntake,
} from "../../services/patientIntake";
import {
  createPatientAlert,
  getOwnProfile,
  getPatientAlerts,
  getPatientAssignments,
  createPatientIntakeCorrectionRequest,
  listPatientIntakeCorrectionRequests,
  listOwnDiagnoses,
} from "../../services/patientWorkspace";

const EMPTY_FORM = {
  current_problem: "",
  symptoms: "",
  symptom_onset: "",
  chronic_conditions_answer: "UNKNOWN",
  chronic_conditions_details: "",
  medications_answer: "UNKNOWN",
  medications_details: "",
  allergies_answer: "UNKNOWN",
  allergies_details: "",
  additional_information: "",
};

function PatientHome() {
  const { t } = useTranslation();
  const [intake, setIntake] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [alertForm, setAlertForm] = useState({ phone: "", location: "", description: "" });
  const [alertNotice, setAlertNotice] = useState("");
  const [alertError, setAlertError] = useState("");
  const [isAlertSubmitting, setIsAlertSubmitting] = useState(false);
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [correctionMessage, setCorrectionMessage] = useState("");
  const [correctionNotice, setCorrectionNotice] = useState("");
  const [correctionError, setCorrectionError] = useState("");
  const [isCorrectionSubmitting, setIsCorrectionSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    getPatientIntake()
      .then(({ data }) => {
        if (!active) return;
        const savedIntake = data.data.intake;
        setIntake(savedIntake);
        if (savedIntake) {
          setForm(formFromIntake(savedIntake));
          if (["UNDER_REVIEW", "DOCTOR_ASSIGNED"].includes(savedIntake.status)) {
            listPatientIntakeCorrectionRequests()
              .then((response) => active && setCorrectionRequests(response.data.data.requests))
              .catch(() => {});
          }
          if (savedIntake.status === "DOCTOR_ASSIGNED") {
            getPatientAssignments()
              .then((assignmentResponse) => active && setAssignments(assignmentResponse.data.data.assignments))
              .catch(() => {});
            listOwnDiagnoses()
              .then((diagnosisResponse) => active && setDiagnoses(diagnosisResponse.data.data.diagnoses))
              .catch(() => {});
          }
        }
      })
      .catch(() => {
        if (active) setError(t("patientWorkspace.loadError"));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    let active = true;
    getOwnProfile().then(({ data }) => active && setProfile(data.data.profile)).catch(() => {});
    getPatientAlerts().then(({ data }) => active && setAlerts(data.data.emergency_alerts)).catch(() => {});
    return () => { active = false; };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setNotice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const request = intake ? updatePatientIntake : submitPatientIntake;
      const { data } = await request(form);
      setIntake(data.data.intake);
      setForm(formFromIntake(data.data.intake));
      setNotice(t(intake ? "patientWorkspace.updated" : "patientWorkspace.submitted"));
    } catch (requestError) {
      setError(
        requestError.response?.status === 409
          ? t("patientWorkspace.lockedError")
          : t("patientWorkspace.saveError"),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAlertSubmit(event) {
    event.preventDefault();
    setIsAlertSubmitting(true);
    setAlertError("");
    setAlertNotice("");
    try {
      const { data } = await createPatientAlert(alertForm);
      setAlerts((current) => [data.data.emergency_alert, ...current]);
      setAlertForm({ phone: "", location: "", description: "" });
      setAlertNotice(t("patientWorkspace.alertSubmitted"));
    } catch {
      setAlertError(t("patientWorkspace.alertError"));
    } finally {
      setIsAlertSubmitting(false);
    }
  }

  async function handleCorrectionSubmit(event) {
    event.preventDefault();
    setIsCorrectionSubmitting(true);
    setCorrectionError("");
    setCorrectionNotice("");
    try {
      const { data } = await createPatientIntakeCorrectionRequest(correctionMessage);
      setCorrectionRequests((current) => [data.data.request, ...current]);
      setCorrectionMessage("");
      setCorrectionNotice(t("patientWorkspace.correctionSent"));
    } catch (requestError) {
      setCorrectionError(requestError.response?.data?.message || t("patientWorkspace.correctionError"));
    } finally {
      setIsCorrectionSubmitting(false);
    }
  }

  const canEdit = !intake || intake.status === "SUBMITTED";
  const statusLabel = intake
    ? t(`patientWorkspace.status.${intake.status}`)
    : t("patientWorkspace.status.NOT_SUBMITTED");

  return (
    <RoleLayout mainClassName="mx-auto max-w-5xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-primary">{t("patientWorkspace.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-bold">{t("patientWorkspace.title")}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-text-secondary">{t("patientWorkspace.intro")}</p>
        </div>

        <nav aria-label={t("patientWorkspace.sections")} className="mb-6 flex flex-wrap gap-3">
          <a href="#patient-intake" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold">{t("patientWorkspace.formTitle")}</a>
          <a href="#patient-profile" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold">{t("patientWorkspace.profile")}</a>
          <a href="#emergency-alerts" className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-2 text-sm font-semibold text-danger">{t("patientWorkspace.emergency")}</a>
        </nav>

        <section id="patient-intake" className="rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-primary/5 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{t("patientWorkspace.formTitle")}</h2>
            <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              {statusLabel}
            </span>
          </div>

          <div className="mb-6 rounded-xl border border-border bg-background p-4 text-sm leading-6 text-text-secondary">
            {intake?.status === "SUBMITTED"
              ? t("patientWorkspace.submittedHint")
              : intake
                ? t("patientWorkspace.lockedHint")
                : t("patientWorkspace.formHint")}
          </div>

          {error && <p role="alert" className="mb-4 rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>}
          {notice && <p role="status" className="mb-4 rounded-xl bg-primary/10 p-4 text-sm text-primary">{notice}</p>}

          {isLoading ? (
            <p className="py-8 text-center text-text-secondary">{t("patientWorkspace.loading")}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <TextArea name="current_problem" label={t("patientWorkspace.currentProblem")} value={form.current_problem} onChange={updateField} disabled={!canEdit} required />
              <TextArea name="symptoms" label={t("patientWorkspace.symptoms")} value={form.symptoms} onChange={updateField} disabled={!canEdit} required />
              <Field label={t("patientWorkspace.onset")}>
                <input name="symptom_onset" value={form.symptom_onset} onChange={updateField} disabled={!canEdit} required maxLength={255} placeholder={t("patientWorkspace.onsetPlaceholder")} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-primary disabled:opacity-70" />
              </Field>
              <AnswerField name="chronic_conditions" label={t("patientWorkspace.chronicConditions")} answer={form.chronic_conditions_answer} details={form.chronic_conditions_details} onChange={updateField} disabled={!canEdit} t={t} />
              <AnswerField name="medications" label={t("patientWorkspace.medications")} answer={form.medications_answer} details={form.medications_details} onChange={updateField} disabled={!canEdit} t={t} />
              <AnswerField name="allergies" label={t("patientWorkspace.allergies")} answer={form.allergies_answer} details={form.allergies_details} onChange={updateField} disabled={!canEdit} t={t} />
              <TextArea name="additional_information" label={t("patientWorkspace.additionalInformation")} value={form.additional_information || ""} onChange={updateField} disabled={!canEdit} />
              {canEdit && (
                <button type="submit" disabled={isSaving} className="rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60">
                  {isSaving ? t("patientWorkspace.saving") : t(intake ? "patientWorkspace.saveChanges" : "patientWorkspace.submit")}
                </button>
              )}
            </form>
          )}
          {intake && !canEdit && (
            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-lg font-bold">{t("patientWorkspace.correctionTitle")}</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{t("patientWorkspace.correctionHint")}</p>
              {correctionError && <p role="alert" className="mt-4 rounded-xl bg-danger/10 p-4 text-sm text-danger">{correctionError}</p>}
              {correctionNotice && <p role="status" className="mt-4 rounded-xl bg-primary/10 p-4 text-sm text-primary">{correctionNotice}</p>}
              <form onSubmit={handleCorrectionSubmit} className="mt-4 space-y-3">
                <textarea required maxLength={10000} rows={4} value={correctionMessage} onChange={(event) => setCorrectionMessage(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3" />
                <button type="submit" disabled={isCorrectionSubmitting} className="rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">{isCorrectionSubmitting ? t("patientWorkspace.saving") : t("patientWorkspace.sendCorrection")}</button>
              </form>
              {correctionRequests.length > 0 && <div className="mt-6 space-y-3">{correctionRequests.map((request) => <article key={request.id} className="rounded-xl border border-border bg-background p-4"><p className="text-xs font-semibold text-text-secondary">{t(`patientWorkspace.correctionStatus.${request.status}`)}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{request.message}</p>{request.admin_response && <p className="mt-3 border-t border-border pt-3 text-sm leading-6"><span className="font-semibold">{t("patientWorkspace.adminResponse")}: </span>{request.admin_response}</p>}</article>)}</div>}
            </div>
          )}
        </section>

        {assignments.length > 0 && (
          <section className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-xl font-bold">{t("patientWorkspace.assignedDoctors")}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {assignments.map((assignment) => <div key={assignment.id} className="rounded-xl border border-border bg-background p-4"><p className="font-bold">{assignment.doctor_name}</p><p className="mt-1 text-sm text-text-secondary">{assignment.specialization}</p><p className="mt-3 text-sm">{t("patientWorkspace.assignmentStatus")}: {t("patientWorkspace.active")}</p><p className="mt-1 text-sm text-text-secondary">{t("patientWorkspace.assignmentNextStep")}</p></div>)}
            </div>
          </section>
        )}

        {intake?.status === "DOCTOR_ASSIGNED" && (
          <section className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-xl font-bold">{t("patientWorkspace.diagnosesTitle")}</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{t("patientWorkspace.diagnosesDescription")}</p>
            {diagnoses.length ? <div className="mt-5 space-y-4">{diagnoses.map((diagnosis) => <article key={diagnosis.id} className="rounded-xl border border-border bg-background p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-bold">{diagnosis.doctor_name} · {diagnosis.specialization}</p><time className="text-xs text-text-secondary">{new Date(diagnosis.documented_at).toLocaleString()}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{diagnosis.diagnosis}</p></article>)}</div> : <p className="mt-5 text-sm text-text-secondary">{t("patientWorkspace.noDiagnoses")}</p>}
          </section>
        )}

        <section id="patient-profile" className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-bold">{t("patientWorkspace.profile")}</h2>
          {profile ? <div className="mt-5 grid gap-4 sm:grid-cols-2"><ReadOnlyField label={t("patientWorkspace.profileName")} value={profile.full_name} /><ReadOnlyField label={t("patientWorkspace.profileEmail")} value={profile.email} /><ReadOnlyField label={t("patientWorkspace.profilePhone")} value={profile.phone} /><ReadOnlyField label={t("patientWorkspace.profileAddress")} value={profile.address} /></div> : <p className="mt-4 text-sm text-text-secondary">{t("patientWorkspace.profileLoading")}</p>}
        </section>

        <section id="emergency-alerts" className="mt-8 rounded-2xl border border-danger/30 bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-bold text-danger">{t("patientWorkspace.emergency")}</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{t("patientWorkspace.emergencyHint")}</p>
          {alertError && <p role="alert" className="mt-4 rounded-xl bg-danger/10 p-4 text-sm text-danger">{alertError}</p>}
          {alertNotice && <p role="status" className="mt-4 rounded-xl bg-primary/10 p-4 text-sm text-primary">{alertNotice}</p>}
          <form onSubmit={handleAlertSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">{t("patientWorkspace.alertPhone")}<input required maxLength={30} value={alertForm.phone} onChange={(event) => setAlertForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 font-normal" /></label>
            <label className="space-y-2 text-sm font-semibold">{t("patientWorkspace.alertLocation")}<input maxLength={255} value={alertForm.location} onChange={(event) => setAlertForm((current) => ({ ...current, location: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 font-normal" /></label>
            <label className="space-y-2 text-sm font-semibold md:col-span-2">{t("patientWorkspace.alertDescription")}<textarea rows={3} maxLength={10000} value={alertForm.description} onChange={(event) => setAlertForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 font-normal" /></label>
            <button type="submit" disabled={isAlertSubmitting} className="w-fit rounded-xl bg-danger px-6 py-3 font-semibold text-white disabled:opacity-60">{isAlertSubmitting ? t("patientWorkspace.saving") : t("patientWorkspace.sendAlert")}</button>
          </form>
          {alerts.length > 0 && <div className="mt-6"><h3 className="font-bold">{t("patientWorkspace.myAlerts")}</h3><ul className="mt-3 space-y-2">{alerts.map((alert) => <li key={alert.id} className="rounded-lg border border-border bg-background px-4 py-3 text-sm">{t(`patientWorkspace.alertStatuses.${alert.status}`, { defaultValue: alert.status })} · {new Date(alert.sent_at).toLocaleString()}</li>)}</ul></div>}
        </section>
    </RoleLayout>
  );
}

function formFromIntake(intake) {
  return Object.fromEntries(
    Object.keys(EMPTY_FORM).map((field) => [
      field,
      intake[field] ?? EMPTY_FORM[field],
    ]),
  );
}

function Field({ label, children }) {
  return <div className="space-y-2"><span className="block text-sm font-semibold">{label}</span>{children}</div>;
}

function ReadOnlyField({ label, value }) {
  return <div className="rounded-xl border border-border bg-background p-4"><p className="text-xs font-semibold text-text-secondary">{label}</p><p className="mt-2 break-words text-sm leading-6">{value || "—"}</p></div>;
}

function TextArea({ name, label, value, onChange, disabled, required = false }) {
  return (
    <Field label={label}>
      <textarea name={name} value={value || ""} onChange={onChange} disabled={disabled} required={required} maxLength={10000} rows={4} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-primary disabled:opacity-70" />
    </Field>
  );
}

function AnswerField({ name, label, answer, details, onChange, disabled, t }) {
  const answerName = `${name === "chronic_conditions" ? "chronic_conditions" : name}_answer`;
  const detailsName = `${name}_details`;
  return (
    <Field label={label}>
      <select name={answerName} value={answer} onChange={onChange} disabled={disabled} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-primary disabled:opacity-70">
        <option value="YES">{t("patientWorkspace.answers.YES")}</option>
        <option value="NO">{t("patientWorkspace.answers.NO")}</option>
        <option value="UNKNOWN">{t("patientWorkspace.answers.UNKNOWN")}</option>
      </select>
      {answer === "YES" && (
        <textarea name={detailsName} value={details || ""} onChange={onChange} disabled={disabled} required maxLength={10000} rows={3} placeholder={t("patientWorkspace.detailsPlaceholder")} className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-text-primary disabled:opacity-70" />
      )}
    </Field>
  );
}

export default PatientHome;
