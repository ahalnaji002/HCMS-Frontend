import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";

const EMPTY_MEDICATION = {
  medication_name: "", dosage: "", frequency: "", duration: "", instructions: "",
};
const EMPTY_APPOINTMENT = {
  appointment_date: "", purpose: "", location: "", status: "SCHEDULED", notes: "",
};

function apiError(error, t, kind) {
  const status = error.response?.status;
  if (status === 400) return t(`doctorPlanResources.errors.validation`);
  if (status === 401) return t("doctorPlanResources.errors.unauthorized");
  if (status === 403) return t("doctorPlanResources.errors.forbidden");
  if (status === 404) return t("doctorPlanResources.errors.notFound");
  if (status === 409) return t(kind === "appointment" ? "doctorPlanResources.errors.appointmentConflict" : "doctorPlanResources.errors.conflict");
  if (status >= 500) return t("doctorPlanResources.errors.server");
  if (!error.response) return t("doctorPlanResources.errors.network");
  return t("doctorPlanResources.errors.unknown");
}

function fieldErrors(error, allowedFields) {
  const errors = error.response?.data?.errors;
  if (!errors || typeof errors !== "object") return {};
  return Object.fromEntries(allowedFields.filter((field) => Object.prototype.hasOwnProperty.call(errors, field)).map((field) => [field, true]));
}

function appointmentInputValue(value) {
  if (typeof value !== "string") return "";
  return value.replace(" ", "T").slice(0, 19);
}

function appointmentApiValue(value) {
  if (!value) return "";
  const wallClock = value.replace("T", " ");
  return wallClock.length === 16 ? `${wallClock}:00` : wallClock;
}

function TreatmentPlanResourcesSection({ plan }) {
  const { t } = useTranslation();
  const { doctorWorkspace } = useApplicationServices();
  const [medications, setMedications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medicationsLoading, setMedicationsLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [medicationError, setMedicationError] = useState("");
  const [appointmentError, setAppointmentError] = useState("");
  const [medicationNotice, setMedicationNotice] = useState("");
  const [appointmentNotice, setAppointmentNotice] = useState("");
  const [medicationMode, setMedicationMode] = useState("none");
  const [appointmentMode, setAppointmentMode] = useState("none");
  const [medicationDraft, setMedicationDraft] = useState(EMPTY_MEDICATION);
  const [appointmentDraft, setAppointmentDraft] = useState(EMPTY_APPOINTMENT);
  const [medicationFieldErrors, setMedicationFieldErrors] = useState({});
  const [appointmentFieldErrors, setAppointmentFieldErrors] = useState({});
  const [savingMedication, setSavingMedication] = useState(false);
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [busyDelete, setBusyDelete] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    let active = true;
    doctorWorkspace.listTreatmentPlanMedications(plan.id)
      .then((response) => active && setMedications(response.data.medications))
      .catch((error) => {
        if (!active) return;
        setMedications([]);
        setMedicationError(apiError(error, t, "medication"));
      })
      .finally(() => active && setMedicationsLoading(false));
    doctorWorkspace.listTreatmentPlanAppointments(plan.id)
      .then((response) => active && setAppointments(response.data.appointments))
      .catch((error) => {
        if (!active) return;
        setAppointments([]);
        setAppointmentError(apiError(error, t, "appointment"));
      })
      .finally(() => active && setAppointmentsLoading(false));
    return () => { active = false; };
  }, [doctorWorkspace, plan.id, t]);

  async function refreshMedications() {
    const response = await doctorWorkspace.listTreatmentPlanMedications(plan.id);
    setMedications(response.data.medications);
  }

  async function refreshAppointments() {
    const response = await doctorWorkspace.listTreatmentPlanAppointments(plan.id);
    setAppointments(response.data.appointments);
  }

  async function editMedication(item) {
    setMedicationError("");
    setMedicationNotice("");
    try {
      const response = await doctorWorkspace.getTreatmentPlanMedication(plan.id, item.id);
      setMedicationDraft({ ...EMPTY_MEDICATION, ...response.data.medication });
      setMedicationMode("edit");
      setMedicationFieldErrors({});
    } catch (error) {
      if (error.response?.status === 403) setMedications([]);
      setMedicationError(apiError(error, t, "medication"));
    }
  }

  async function editAppointment(item) {
    setAppointmentError("");
    setAppointmentNotice("");
    try {
      const response = await doctorWorkspace.getTreatmentPlanAppointment(plan.id, item.id);
      const appointment = response.data.appointment;
      setAppointmentDraft({ ...EMPTY_APPOINTMENT, ...appointment, appointment_date: appointmentInputValue(appointment.appointment_date) });
      setAppointmentMode("edit");
      setAppointmentFieldErrors({});
    } catch (error) {
      if (error.response?.status === 403) setAppointments([]);
      setAppointmentError(apiError(error, t, "appointment"));
    }
  }

  async function saveMedication(event) {
    event.preventDefault();
    setSavingMedication(true);
    setMedicationError("");
    setMedicationNotice("");
    setMedicationFieldErrors({});
    const payload = medicationMode === "edit" ? {
      medication_name: medicationDraft.medication_name.trim(),
      dosage: medicationDraft.dosage.trim(),
      frequency: medicationDraft.frequency.trim(),
      duration: medicationDraft.duration.trim(),
      instructions: medicationDraft.instructions.trim(),
    } : {
      medication_name: medicationDraft.medication_name.trim(),
      dosage: medicationDraft.dosage.trim(),
      frequency: medicationDraft.frequency.trim(),
      ...(medicationDraft.duration.trim() ? { duration: medicationDraft.duration.trim() } : {}),
      ...(medicationDraft.instructions.trim() ? { instructions: medicationDraft.instructions.trim() } : {}),
    };
    try {
      if (medicationMode === "edit") {
        await doctorWorkspace.updateTreatmentPlanMedication(plan.id, medicationDraft.id, payload);
      } else {
        await doctorWorkspace.createTreatmentPlanMedication(plan.id, payload);
      }
      setMedicationMode("none");
      setMedicationDraft(EMPTY_MEDICATION);
      setMedicationNotice(t(medicationMode === "edit" ? "doctorPlanResources.medicationUpdated" : "doctorPlanResources.medicationCreated"));
      try { await refreshMedications(); } catch (error) { setMedicationError(apiError(error, t, "medication")); }
    } catch (error) {
      if (error.response?.status === 403) setMedications([]);
      setMedicationError(apiError(error, t, "medication"));
      setMedicationFieldErrors(fieldErrors(error, Object.keys(EMPTY_MEDICATION)));
    } finally { setSavingMedication(false); }
  }

  function validateAppointmentDate(value) {
    const date = value.slice(0, 10);
    if (date < plan.start_date || (plan.end_date && date > plan.end_date)) {
      setAppointmentFieldErrors({ appointment_date: true });
      setAppointmentError(t("doctorPlanResources.errors.appointmentDateRange"));
      return false;
    }
    return true;
  }

  async function saveAppointment(event) {
    event.preventDefault();
    setAppointmentError("");
    setAppointmentNotice("");
    setAppointmentFieldErrors({});
    if (!validateAppointmentDate(appointmentDraft.appointment_date)) return;
    setSavingAppointment(true);
    const payload = appointmentMode === "edit" ? {
      appointment_date: appointmentApiValue(appointmentDraft.appointment_date),
      purpose: appointmentDraft.purpose.trim(),
      location: appointmentDraft.location.trim(),
      status: appointmentDraft.status,
      notes: appointmentDraft.notes.trim(),
    } : {
      appointment_date: appointmentApiValue(appointmentDraft.appointment_date),
      purpose: appointmentDraft.purpose.trim(),
      ...(appointmentDraft.location.trim() ? { location: appointmentDraft.location.trim() } : {}),
      ...(appointmentDraft.notes.trim() ? { notes: appointmentDraft.notes.trim() } : {}),
    };
    try {
      if (appointmentMode === "edit") {
        await doctorWorkspace.updateTreatmentPlanAppointment(plan.id, appointmentDraft.id, payload);
      } else {
        await doctorWorkspace.createTreatmentPlanAppointment(plan.id, payload);
      }
      setAppointmentMode("none");
      setAppointmentDraft(EMPTY_APPOINTMENT);
      setAppointmentNotice(t(appointmentMode === "edit" ? "doctorPlanResources.appointmentUpdated" : "doctorPlanResources.appointmentCreated"));
      try { await refreshAppointments(); } catch (error) { setAppointmentError(apiError(error, t, "appointment")); }
    } catch (error) {
      if (error.response?.status === 403) setAppointments([]);
      setAppointmentError(apiError(error, t, "appointment"));
      setAppointmentFieldErrors(fieldErrors(error, Object.keys(EMPTY_APPOINTMENT)));
    } finally { setSavingAppointment(false); }
  }

  async function removeItem(kind, item) {
    const busyKey = `${kind}-${item.id}`;
    setBusyDelete(busyKey);
    if (kind === "medication") { setMedicationError(""); setMedicationNotice(""); }
    else { setAppointmentError(""); setAppointmentNotice(""); }
    try {
      if (kind === "medication") {
        await doctorWorkspace.deleteTreatmentPlanMedication(plan.id, item.id);
        setMedicationNotice(t("doctorPlanResources.medicationDeleted"));
        try { await refreshMedications(); } catch (error) { setMedicationError(apiError(error, t, kind)); }
      } else {
        await doctorWorkspace.deleteTreatmentPlanAppointment(plan.id, item.id);
        setAppointmentNotice(t("doctorPlanResources.appointmentDeleted"));
        try { await refreshAppointments(); } catch (error) { setAppointmentError(apiError(error, t, kind)); }
      }
      setConfirmDelete(null);
    } catch (error) {
      if (error.response?.status === 403) {
        if (kind === "medication") setMedications([]);
        else setAppointments([]);
      }
      if (kind === "medication") setMedicationError(apiError(error, t, kind));
      else setAppointmentError(apiError(error, t, kind));
    } finally { setBusyDelete(""); }
  }

  return (
    <section className="mt-7 space-y-6 border-t border-border pt-6" aria-label={t("doctorPlanResources.title")}>
      <div>
        <h3 className="text-xl font-bold">{t("doctorPlanResources.title")}</h3>
        <p className="mt-1 text-sm text-text-secondary">{t("doctorPlanResources.planName")}: {plan.title}</p>
      </div>
      <ResourcePanel
        kind="medication" t={t} items={medications} loading={medicationsLoading} error={medicationError} notice={medicationNotice}
        mode={medicationMode} draft={medicationDraft} fieldErrors={medicationFieldErrors} saving={savingMedication}
        onCreate={() => { setMedicationDraft(EMPTY_MEDICATION); setMedicationMode("create"); setMedicationError(""); setMedicationNotice(""); setMedicationFieldErrors({}); }}
        onCancel={() => setMedicationMode("none")} onEdit={editMedication} onChange={setMedicationDraft} onSave={saveMedication}
        confirmDelete={confirmDelete} onConfirmDelete={setConfirmDelete} busyDelete={busyDelete} onDelete={removeItem}
      />
      <ResourcePanel
        kind="appointment" t={t} items={appointments} loading={appointmentsLoading} error={appointmentError} notice={appointmentNotice}
        mode={appointmentMode} draft={appointmentDraft} fieldErrors={appointmentFieldErrors} saving={savingAppointment}
        onCreate={() => { setAppointmentDraft(EMPTY_APPOINTMENT); setAppointmentMode("create"); setAppointmentError(""); setAppointmentNotice(""); setAppointmentFieldErrors({}); }}
        onCancel={() => setAppointmentMode("none")} onEdit={editAppointment} onChange={setAppointmentDraft} onSave={saveAppointment}
        confirmDelete={confirmDelete} onConfirmDelete={setConfirmDelete} busyDelete={busyDelete} onDelete={removeItem}
      />
    </section>
  );
}

function ResourcePanel({ kind, t, items, loading, error, notice, mode, draft, fieldErrors, saving, onCreate, onCancel, onEdit, onChange, onSave, confirmDelete, onConfirmDelete, busyDelete, onDelete }) {
  const isMedication = kind === "medication";
  const root = isMedication ? "doctorPlanResources.medication" : "doctorPlanResources.appointment";
  const fields = isMedication
    ? ["medication_name", "dosage", "frequency", "duration", "instructions"]
    : ["appointment_date", "purpose", "location", ...(mode === "edit" ? ["status"] : []), "notes"];
  const fieldKeys = isMedication
    ? { medication_name: "name", dosage: "dosage", frequency: "frequency", duration: "duration", instructions: "instructions" }
    : { appointment_date: "date", purpose: "purpose", location: "location", status: "status", notes: "notes" };

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-bold">{t(`${root}.title`)}</h4>
        <button type="button" onClick={onCreate} className="min-h-10 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{t(`${root}.create`)}</button>
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-lg bg-primary/10 p-3 text-sm text-primary">{notice}</p>}
      {loading ? <p className="mt-4 text-sm text-text-secondary">{t(`${root}.loading`)}</p> : items.length === 0 ? <p className="mt-4 text-sm text-text-secondary">{t(`${root}.empty`)}</p> : (
        <ul className="mt-4 space-y-3">{items.map((item) => (
          <li key={item.id} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{isMedication ? item.medication_name : item.purpose}</p>
                <p className="mt-1 break-words text-sm text-text-secondary">{isMedication ? `${item.dosage} · ${item.frequency}` : item.appointment_date}</p>
                {isMedication ? <>{item.duration && <p className="mt-2 text-sm text-text-secondary">{t(`${root}.fields.duration`)}: {item.duration}</p>}{item.instructions && <p className="mt-2 whitespace-pre-wrap text-sm">{item.instructions}</p>}</> : <><p className="mt-2 text-sm text-text-secondary">{t(`${root}.statusValues.${item.status}`)}{item.location ? ` · ${item.location}` : ""}</p>{item.notes && <p className="mt-2 whitespace-pre-wrap text-sm">{item.notes}</p>}</>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onEdit(item)} className="min-h-10 rounded-lg border border-border px-3 py-2 text-sm font-semibold">{t(`${root}.edit`)}</button>
                <button type="button" onClick={() => onConfirmDelete({ kind, id: item.id })} className="min-h-10 rounded-lg border border-danger/40 px-3 py-2 text-sm font-semibold text-danger">{t(`${root}.delete`)}</button>
              </div>
            </div>
            {confirmDelete?.kind === kind && confirmDelete.id === item.id && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-danger/5 p-3"><p className="text-sm">{t(`${root}.confirmDelete`)}</p><button type="button" disabled={busyDelete === `${kind}-${item.id}`} onClick={() => onDelete(kind, item)} className="min-h-10 rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{busyDelete === `${kind}-${item.id}` ? t("doctorPlanResources.saving") : t("doctorPlanResources.confirm")}</button><button type="button" onClick={() => onConfirmDelete(null)} className="min-h-10 rounded-lg border border-border px-3 py-2 text-sm">{t("doctorPlanResources.cancel")}</button></div>}
          </li>
        ))}</ul>
      )}
      {(mode === "create" || mode === "edit") && <form onSubmit={onSave} className="mt-5 space-y-3 border-t border-border pt-5">
        <h5 className="font-semibold">{t(`${root}.${mode === "edit" ? "editTitle" : "createTitle"}`)}</h5>
        {fields.map((field) => <label key={field} className="block text-sm font-semibold">{t(`${root}.fields.${fieldKeys[field]}`)}
          {field === "instructions" || field === "notes" ? <textarea rows={3} value={draft[field] || ""} onChange={(event) => onChange((current) => ({ ...current, [field]: event.target.value }))} aria-invalid={Boolean(fieldErrors[field])} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-normal" />
            : field === "status" ? <select value={draft.status} onChange={(event) => onChange((current) => ({ ...current, status: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 font-normal">{Object.entries(t(`${root}.statusValues`, { returnObjects: true })).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              : <input required={field !== "duration" && field !== "location"} type={field === "appointment_date" ? "datetime-local" : "text"} step={field === "appointment_date" ? 1 : undefined} value={field === "appointment_date" ? appointmentInputValue(draft[field]) : draft[field] || ""} onChange={(event) => onChange((current) => ({ ...current, [field]: event.target.value }))} aria-invalid={Boolean(fieldErrors[field])} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 font-normal" />}
          {fieldErrors[field] && <span className="mt-1 block text-xs font-normal text-danger">{t("doctorPlanResources.fieldInvalid")}</span>}
        </label>)}
        <div className="flex flex-wrap gap-3"><button type="submit" disabled={saving} className="min-h-10 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? t("doctorPlanResources.saving") : t(`${root}.save`)}</button><button type="button" onClick={onCancel} className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm">{t("doctorPlanResources.cancel")}</button></div>
      </form>}
    </div>
  );
}

export default TreatmentPlanResourcesSection;
