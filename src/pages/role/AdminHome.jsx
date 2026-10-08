import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import RoleLayout from "../../layouts/RoleLayout";
import {
  assignDoctorToPatient,
  listActiveDoctors,
  listPatientIntakes,
  startPatientIntakeReview,
  updateDoctorWorkload,
  listIntakeCorrectionRequests,
  resolveIntakeCorrectionRequest,
  listAdminEmergencyAlerts,
  assignDoctorToEmergencyAlert,
} from "../../services/adminPatientIntakes";

function AdminHome() {
  const { t } = useTranslation();
  const [intakes, setIntakes] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [reasons, setReasons] = useState({});
  const [selectedDoctors, setSelectedDoctors] = useState({});
  const [workloadDrafts, setWorkloadDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [correctionResponses, setCorrectionResponses] = useState({});
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [emergencyDoctors, setEmergencyDoctors] = useState({});

  const refresh = useCallback(async () => {
    const [intakeResponse, doctorResponse, correctionResponse, emergencyResponse] = await Promise.all([
      listPatientIntakes(),
      listActiveDoctors(),
      listIntakeCorrectionRequests(),
      listAdminEmergencyAlerts(),
    ]);
    setIntakes(intakeResponse.data.data.intakes);
    setCorrectionRequests(correctionResponse.data.data.requests);
    setEmergencyAlerts(emergencyResponse.data.data.emergency_alerts);
    const activeDoctors = doctorResponse.data.data.doctors;
    setDoctors(activeDoctors);
    setWorkloadDrafts(Object.fromEntries(activeDoctors.map((doctor) => [doctor.id, {
      availability: doctor.availability,
      capacity_limit: doctor.capacity_limit ?? "",
    }])));
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([listPatientIntakes(), listActiveDoctors(), listIntakeCorrectionRequests(), listAdminEmergencyAlerts()])
      .then(([intakeResponse, doctorResponse, correctionResponse, emergencyResponse]) => {
        if (!active) return;
        setIntakes(intakeResponse.data.data.intakes);
        setCorrectionRequests(correctionResponse.data.data.requests);
        setEmergencyAlerts(emergencyResponse.data.data.emergency_alerts);
        const activeDoctors = doctorResponse.data.data.doctors;
        setDoctors(activeDoctors);
        setWorkloadDrafts(Object.fromEntries(activeDoctors.map((doctor) => [doctor.id, {
          availability: doctor.availability,
          capacity_limit: doctor.capacity_limit ?? "",
        }])));
      })
      .catch(() => {
        if (active) setError(t("adminIntakes.loadError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [t]);

  async function handleStartReview(intakeId) {
    setBusyId(intakeId);
    setError("");
    setNotice("");
    try {
      await startPatientIntakeReview(intakeId);
      await refresh();
      setNotice(t("adminIntakes.reviewStarted"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("adminIntakes.actionError"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleAssign(intake) {
    const doctorId = selectedDoctors[intake.id];
    const assignmentReason = reasons[intake.id]?.trim();
    if (!doctorId || !assignmentReason) {
      setError(t("adminIntakes.assignmentRequired"));
      return;
    }
    setBusyId(intake.id);
    setError("");
    setNotice("");
    try {
      await assignDoctorToPatient({
        doctor_id: doctorId,
        patient_id: intake.patient_id,
        assignment_reason: assignmentReason,
      });
      setReasons((current) => ({ ...current, [intake.id]: "" }));
      await refresh();
      setNotice(t("adminIntakes.assignmentSaved"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("adminIntakes.actionError"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleEmergencyAssign(alert) {
    const doctorId = emergencyDoctors[alert.id];
    if (!doctorId) {
      setError(t("adminIntakes.emergencyDoctorRequired"));
      return;
    }
    setBusyId(`emergency-${alert.id}`);
    setError("");
    setNotice("");
    try {
      await assignDoctorToEmergencyAlert(alert.id, doctorId);
      await refresh();
      setNotice(t("adminIntakes.emergencyAssigned"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("adminIntakes.actionError"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveWorkload(doctor) {
    const draft = workloadDrafts[doctor.id];
    if (!draft) return;
    setBusyId(`doctor-${doctor.id}`);
    setError("");
    setNotice("");
    try {
      await updateDoctorWorkload(doctor.id, {
        availability: draft.availability,
        capacity_limit: draft.capacity_limit === "" ? null : Number(draft.capacity_limit),
      });
      await refresh();
      setNotice(t("adminIntakes.workloadSaved"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("adminIntakes.actionError"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolveCorrection(request) {
    setBusyId(`correction-${request.id}`);
    setError("");
    setNotice("");
    try {
      await resolveIntakeCorrectionRequest(request.id, correctionResponses[request.id] || "");
      await refresh();
      setNotice(t("adminIntakes.correctionResolved"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("adminIntakes.actionError"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <RoleLayout mainClassName="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-primary">{t("adminIntakes.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-bold">{t("adminIntakes.title")}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-text-secondary">{t("adminIntakes.description")}</p>
        {error && <p role="alert" className="mt-6 rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>}
        {notice && <p role="status" className="mt-6 rounded-xl bg-primary/10 p-4 text-sm text-primary">{notice}</p>}
        <section className="mt-8 rounded-2xl border border-danger/30 bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-bold text-danger">{t("adminIntakes.emergencyTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{t("adminIntakes.emergencyDescription")}</p>
          {emergencyAlerts.length === 0 ? <p className="mt-5 text-sm text-text-secondary">{t("adminIntakes.noEmergencies")}</p> : <div className="mt-5 space-y-4">{emergencyAlerts.map((alert) => <article key={alert.id} className="rounded-xl border border-border bg-background p-5"><div className="flex flex-wrap justify-between gap-2"><p className="font-bold">{alert.phone} · {alert.location || "—"}</p><span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">{t(`patientWorkspace.alertStatuses.${alert.status}`, { defaultValue: alert.status })}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{alert.description || "—"}</p><p className="mt-2 text-xs text-text-secondary">{new Date(alert.sent_at).toLocaleString()}</p>{alert.status === "PENDING_ASSIGNMENT" && <div className="mt-4 flex flex-wrap gap-3"><select aria-label={t("adminIntakes.emergencyDoctor")} value={emergencyDoctors[alert.id] || ""} onChange={(event) => setEmergencyDoctors((current) => ({ ...current, [alert.id]: event.target.value }))} className="min-w-64 rounded-lg border border-border bg-surface px-3 py-2"><option value="">{t("adminIntakes.selectDoctor")}</option>{doctors.filter((doctor) => ["General Medicine", "Emergency Medicine"].includes(doctor.specialization)).map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.full_name} — {doctor.specialization} ({t(`adminIntakes.availabilityValues.${doctor.availability}`)}; {doctor.active_assignment_count}/{doctor.capacity_limit ?? "∞"})</option>)}</select><button type="button" disabled={busyId === `emergency-${alert.id}`} onClick={() => handleEmergencyAssign(alert)} className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busyId === `emergency-${alert.id}` ? t("adminIntakes.working") : t("adminIntakes.assignEmergency")}</button></div>}</article>)}</div>}
        </section>
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-bold">{t("adminIntakes.correctionsTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{t("adminIntakes.correctionsDescription")}</p>
          {correctionRequests.length === 0 ? <p className="mt-5 text-sm text-text-secondary">{t("adminIntakes.noCorrections")}</p> : <div className="mt-5 space-y-4">{correctionRequests.map((request) => <article key={request.id} className="rounded-xl border border-border bg-background p-5"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-bold">{request.patient_name}</p><p className="text-sm text-text-secondary">{request.patient_email}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold">{t(`adminIntakes.correctionStatus.${request.status}`)}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6">{request.message}</p>{request.admin_response && <p className="mt-3 text-sm leading-6"><span className="font-semibold">{t("adminIntakes.adminResponse")}: </span>{request.admin_response}</p>}{request.status === "OPEN" && <div className="mt-4 space-y-3"><textarea rows={3} maxLength={10000} placeholder={t("adminIntakes.responsePlaceholder")} value={correctionResponses[request.id] || ""} onChange={(event) => setCorrectionResponses((current) => ({ ...current, [request.id]: event.target.value }))} className="w-full rounded-xl border border-border bg-surface px-4 py-3" /><button type="button" disabled={busyId === `correction-${request.id}`} onClick={() => handleResolveCorrection(request)} className="rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">{busyId === `correction-${request.id}` ? t("adminIntakes.working") : t("adminIntakes.resolveCorrection")}</button></div>}</article>)}</div>}
        </section>
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-bold">{t("adminIntakes.workloadTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{t("adminIntakes.workloadDescription")}</p>
          {doctors.length === 0 ? <p className="mt-5 text-sm text-text-secondary">{t("adminIntakes.noDoctors")}</p> : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {doctors.map((doctor) => {
                const draft = workloadDrafts[doctor.id] || { availability: doctor.availability, capacity_limit: doctor.capacity_limit ?? "" };
                const load = Number(doctor.active_assignment_count || 0);
                const full = doctor.capacity_limit !== null && doctor.capacity_limit !== undefined && load >= Number(doctor.capacity_limit);
                return (
                  <div key={doctor.id} className="rounded-xl border border-border bg-background p-5">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div><p className="font-bold">{doctor.full_name}</p><p className="text-sm text-text-secondary">{doctor.specialization}</p></div>
                      {full && <span className="h-fit rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">{t("adminIntakes.capacityAlert")}</span>}
                    </div>
                    <p className="mt-4 text-sm text-text-secondary">{t("adminIntakes.activeAssignments")}: {load} / {doctor.capacity_limit ?? t("adminIntakes.notConfigured")}</p>
                    <p className="mt-1 text-sm text-text-secondary">{t("adminIntakes.openEmergencies")}: {doctor.open_emergency_alert_count || 0}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-semibold">{t("adminIntakes.availability")}
                        <select value={draft.availability} onChange={(event) => setWorkloadDrafts((current) => ({ ...current, [doctor.id]: { ...draft, availability: event.target.value } }))} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 font-normal">
                          <option value="AVAILABLE">{t("adminIntakes.available")}</option><option value="UNAVAILABLE">{t("adminIntakes.unavailable")}</option>
                        </select>
                      </label>
                      <label className="text-sm font-semibold">{t("adminIntakes.capacity")}
                        <input type="number" min="0" max="4294967295" value={draft.capacity_limit} onChange={(event) => setWorkloadDrafts((current) => ({ ...current, [doctor.id]: { ...draft, capacity_limit: event.target.value } }))} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 font-normal" />
                      </label>
                    </div>
                    <button type="button" onClick={() => handleSaveWorkload(doctor)} disabled={busyId === `doctor-${doctor.id}`} className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60">{t("adminIntakes.saveWorkload")}</button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        {loading ? <p className="py-12 text-center text-text-secondary">{t("adminIntakes.loading")}</p> : intakes.length === 0 ? (
          <p className="mt-8 rounded-xl border border-border bg-surface p-6 text-text-secondary">{t("adminIntakes.empty")}</p>
        ) : (
          <div className="mt-8 space-y-6">
            {intakes.map((intake) => (
              <article key={intake.id} className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{intake.patient_name}</h2>
                    <p className="mt-1 text-sm text-text-secondary">{intake.patient_email}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">{t(`patientWorkspace.status.${intake.status}`)}</span>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <ReadOnlyField label={t("patientWorkspace.currentProblem")} value={intake.current_problem} />
                  <ReadOnlyField label={t("patientWorkspace.symptoms")} value={intake.symptoms} />
                  <ReadOnlyField label={t("patientWorkspace.onset")} value={intake.symptom_onset} />
                  <ReadOnlyField label={t("patientWorkspace.chronicConditions")} value={answerText(t, intake.chronic_conditions_answer, intake.chronic_conditions_details)} />
                  <ReadOnlyField label={t("patientWorkspace.medications")} value={answerText(t, intake.medications_answer, intake.medications_details)} />
                  <ReadOnlyField label={t("patientWorkspace.allergies")} value={answerText(t, intake.allergies_answer, intake.allergies_details)} />
                  {intake.additional_information && <ReadOnlyField label={t("patientWorkspace.additionalInformation")} value={intake.additional_information} />}
                </div>
                {intake.status === "SUBMITTED" && (
                  <button type="button" disabled={busyId === intake.id} onClick={() => handleStartReview(intake.id)} className="mt-6 rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">
                    {busyId === intake.id ? t("adminIntakes.working") : t("adminIntakes.startReview")}
                  </button>
                )}
                {["UNDER_REVIEW", "DOCTOR_ASSIGNED"].includes(intake.status) && (
                  <div className="mt-6 border-t border-border pt-6">
                    <h3 className="font-bold">{t("adminIntakes.assignTitle")}</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm font-semibold">
                        <span className="block">{t("adminIntakes.doctor")}</span>
                        <select value={selectedDoctors[intake.id] || ""} onChange={(event) => setSelectedDoctors((current) => ({ ...current, [intake.id]: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 font-normal">
                          <option value="">{t("adminIntakes.selectDoctor")}</option>
                          {doctors.map((doctor) => <option key={doctor.id} value={doctor.id} disabled={doctor.availability === "UNAVAILABLE"}>{doctor.full_name} — {doctor.specialization} ({t(`adminIntakes.availabilityValues.${doctor.availability}`)}; {doctor.active_assignment_count}/{doctor.capacity_limit ?? "∞"})</option>)}
                        </select>
                      </label>
                      <label className="space-y-2 text-sm font-semibold">
                        <span className="block">{t("adminIntakes.reason")}</span>
                        <input maxLength={255} value={reasons[intake.id] || ""} onChange={(event) => setReasons((current) => ({ ...current, [intake.id]: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 font-normal" />
                      </label>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">{t("adminIntakes.multipleAssignments")}</p>
                    <button type="button" disabled={busyId === intake.id} onClick={() => handleAssign(intake)} className="mt-4 rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">
                      {busyId === intake.id ? t("adminIntakes.working") : t("adminIntakes.assign")}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
    </RoleLayout>
  );
}

function answerText(t, answer, details) {
  const answerLabel = t(`patientWorkspace.answers.${answer}`);
  return answer === "YES" && details ? `${answerLabel} — ${details}` : answerLabel;
}

function ReadOnlyField({ label, value }) {
  return <div className="rounded-xl border border-border bg-background p-4"><p className="text-xs font-semibold text-text-secondary">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{value || "—"}</p></div>;
}

export default AdminHome;
