import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import {
  Button, ConfirmAction, EmptyState, ErrorState, LoadingState, SelectField, StatusBadge,
  TextareaField, TextField, useToast,
} from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";

const EMPTY_MEDICATION = {
  medication_name: "", dosage: "", frequency: "", duration: "", instructions: "",
};
const EMPTY_APPOINTMENT = {
  appointment_date: "", purpose: "", location: "", status: "SCHEDULED", notes: "",
};

function errorKey(error, kind) {
  const status = error.response?.status;
  if (status === 400) return "doctorPlanResources.errors.validation";
  if (status === 401) return "doctorPlanResources.errors.unauthorized";
  if (status === 403) return "doctorPlanResources.errors.forbidden";
  if (status === 404) return "doctorPlanResources.errors.notFound";
  if (status === 409) return kind === "appointment" ? "doctorPlanResources.errors.appointmentConflict" : "doctorPlanResources.errors.conflict";
  if (status >= 500) return "doctorPlanResources.errors.server";
  if (!error.response) return "doctorPlanResources.errors.network";
  return "doctorPlanResources.errors.unknown";
}

function fieldErrors(error, allowedFields) {
  const errors = error.response?.data?.errors;
  if (!errors || typeof errors !== "object") return {};
  return Object.fromEntries(allowedFields.filter((field) => Object.prototype.hasOwnProperty.call(errors, field)).map((field) => [field, true]));
}

// Appointment times are wall-clock values ("2026-12-05 09:15:00"), sent and
// shown without timezone conversion.
function appointmentInputValue(value) {
  if (typeof value !== "string") return "";
  return value.replace(" ", "T").slice(0, 19);
}

function appointmentApiValue(value) {
  if (!value) return "";
  const wallClock = value.replace("T", " ");
  return wallClock.length === 16 ? `${wallClock}:00` : wallClock;
}

// One list (medications or appointments) with its loading state, items, and form.
function useResource(plan, kind, service) {
  const { doctorWorkspace } = useApplicationServices();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    doctorWorkspace[service.list](plan.id)
      .then((response) => { if (active) setItems(response.data[service.key]); })
      .catch((error) => { if (active) { setItems([]); setLoadError(errorKey(error, kind)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [doctorWorkspace, plan.id, kind, service]);

  async function refresh() {
    const response = await doctorWorkspace[service.list](plan.id);
    setItems(response.data[service.key]);
  }

  return { items, setItems, loading, loadError, refresh };
}

const MEDICATION_SERVICE = { list: "listTreatmentPlanMedications", key: "medications" };
const APPOINTMENT_SERVICE = { list: "listTreatmentPlanAppointments", key: "appointments" };

function TreatmentPlanResourcesSection({ plan }) {
  const { t } = useTranslation();
  const { doctorWorkspace } = useApplicationServices();
  const toast = useToast();
  const medications = useResource(plan, "medication", MEDICATION_SERVICE);
  const appointments = useResource(plan, "appointment", APPOINTMENT_SERVICE);
  const [medicationMode, setMedicationMode] = useState("none");
  const [appointmentMode, setAppointmentMode] = useState("none");
  const [medicationDraft, setMedicationDraft] = useState(EMPTY_MEDICATION);
  const [appointmentDraft, setAppointmentDraft] = useState(EMPTY_APPOINTMENT);
  const [medicationFieldErrors, setMedicationFieldErrors] = useState({});
  const [appointmentFieldErrors, setAppointmentFieldErrors] = useState({});
  const [savingMedication, setSavingMedication] = useState(false);
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [busyDelete, setBusyDelete] = useState("");

  function fail(error, kind) {
    if (error.response?.status === 403) (kind === "medication" ? medications : appointments).setItems([]);
    toast.error({ key: errorKey(error, kind) });
  }

  async function refreshAfterChange(kind) {
    try {
      await (kind === "medication" ? medications : appointments).refresh();
    } catch (error) {
      toast.error({ key: errorKey(error, kind) });
    }
  }

  async function editMedication(item) {
    try {
      const response = await doctorWorkspace.getTreatmentPlanMedication(plan.id, item.id);
      setMedicationDraft({ ...EMPTY_MEDICATION, ...response.data.medication });
      setMedicationMode("edit");
      setMedicationFieldErrors({});
    } catch (error) {
      fail(error, "medication");
    }
  }

  async function editAppointment(item) {
    try {
      const response = await doctorWorkspace.getTreatmentPlanAppointment(plan.id, item.id);
      const appointment = response.data.appointment;
      setAppointmentDraft({ ...EMPTY_APPOINTMENT, ...appointment, appointment_date: appointmentInputValue(appointment.appointment_date) });
      setAppointmentMode("edit");
      setAppointmentFieldErrors({});
    } catch (error) {
      fail(error, "appointment");
    }
  }

  async function saveMedication(event) {
    event.preventDefault();
    setSavingMedication(true);
    setMedicationFieldErrors({});
    const trimmed = Object.fromEntries(Object.keys(EMPTY_MEDICATION).map((field) => [field, (medicationDraft[field] || "").trim()]));
    const payload = medicationMode === "edit" ? trimmed : {
      medication_name: trimmed.medication_name,
      dosage: trimmed.dosage,
      frequency: trimmed.frequency,
      ...(trimmed.duration ? { duration: trimmed.duration } : {}),
      ...(trimmed.instructions ? { instructions: trimmed.instructions } : {}),
    };
    try {
      if (medicationMode === "edit") {
        await doctorWorkspace.updateTreatmentPlanMedication(plan.id, medicationDraft.id, payload);
      } else {
        await doctorWorkspace.createTreatmentPlanMedication(plan.id, payload);
      }
      toast.success({ key: medicationMode === "edit" ? "doctorPlanResources.medicationUpdated" : "doctorPlanResources.medicationCreated" });
      setMedicationMode("none");
      setMedicationDraft(EMPTY_MEDICATION);
      await refreshAfterChange("medication");
    } catch (error) {
      fail(error, "medication");
      setMedicationFieldErrors(fieldErrors(error, Object.keys(EMPTY_MEDICATION)));
    } finally {
      setSavingMedication(false);
    }
  }

  async function saveAppointment(event) {
    event.preventDefault();
    setAppointmentFieldErrors({});
    const day = appointmentDraft.appointment_date.slice(0, 10);
    if (day < plan.start_date || (plan.end_date && day > plan.end_date)) {
      setAppointmentFieldErrors({ appointment_date: true });
      toast.error({ key: "doctorPlanResources.errors.appointmentDateRange" });
      return;
    }
    setSavingAppointment(true);
    const payload = appointmentMode === "edit" ? {
      appointment_date: appointmentApiValue(appointmentDraft.appointment_date),
      purpose: appointmentDraft.purpose.trim(),
      location: (appointmentDraft.location || "").trim(),
      status: appointmentDraft.status,
      notes: (appointmentDraft.notes || "").trim(),
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
      toast.success({ key: appointmentMode === "edit" ? "doctorPlanResources.appointmentUpdated" : "doctorPlanResources.appointmentCreated" });
      setAppointmentMode("none");
      setAppointmentDraft(EMPTY_APPOINTMENT);
      await refreshAfterChange("appointment");
    } catch (error) {
      fail(error, "appointment");
      setAppointmentFieldErrors(fieldErrors(error, Object.keys(EMPTY_APPOINTMENT)));
    } finally {
      setSavingAppointment(false);
    }
  }

  async function removeItem(kind, item) {
    setBusyDelete(`${kind}-${item.id}`);
    try {
      if (kind === "medication") await doctorWorkspace.deleteTreatmentPlanMedication(plan.id, item.id);
      else await doctorWorkspace.deleteTreatmentPlanAppointment(plan.id, item.id);
      toast.success({ key: kind === "medication" ? "doctorPlanResources.medicationDeleted" : "doctorPlanResources.appointmentDeleted" });
      await refreshAfterChange(kind);
    } catch (error) {
      fail(error, kind);
    } finally {
      setBusyDelete("");
    }
  }

  return (
    <section className="mt-7 space-y-6 border-t border-border pt-6" aria-label={t("doctorPlanResources.title")}>
      <div>
        <h3 className="text-xl font-bold">{t("doctorPlanResources.title")}</h3>
        <p className="mt-1 text-sm text-text-secondary">{t("doctorPlanResources.planName")}: {plan.title}</p>
      </div>
      <ResourcePanel
        kind="medication" t={t} resource={medications}
        mode={medicationMode} draft={medicationDraft} fieldErrors={medicationFieldErrors} saving={savingMedication}
        onCreate={() => { setMedicationDraft(EMPTY_MEDICATION); setMedicationMode("create"); setMedicationFieldErrors({}); }}
        onCancel={() => setMedicationMode("none")} onEdit={editMedication} onChange={setMedicationDraft} onSave={saveMedication}
        busyDelete={busyDelete} onDelete={removeItem}
      />
      <ResourcePanel
        kind="appointment" t={t} resource={appointments}
        mode={appointmentMode} draft={appointmentDraft} fieldErrors={appointmentFieldErrors} saving={savingAppointment}
        onCreate={() => { setAppointmentDraft(EMPTY_APPOINTMENT); setAppointmentMode("create"); setAppointmentFieldErrors({}); }}
        onCancel={() => setAppointmentMode("none")} onEdit={editAppointment} onChange={setAppointmentDraft} onSave={saveAppointment}
        busyDelete={busyDelete} onDelete={removeItem}
      />
    </section>
  );
}

function ResourcePanel({ kind, t, resource, mode, draft, fieldErrors, saving, onCreate, onCancel, onEdit, onChange, onSave, busyDelete, onDelete }) {
  const { dateTime } = useFormatDate();
  const isMedication = kind === "medication";
  const root = isMedication ? "doctorPlanResources.medication" : "doctorPlanResources.appointment";
  const fields = isMedication
    ? ["medication_name", "dosage", "frequency", "duration", "instructions"]
    : ["appointment_date", "purpose", "location", ...(mode === "edit" ? ["status"] : []), "notes"];
  const fieldKeys = isMedication
    ? { medication_name: "name", dosage: "dosage", frequency: "frequency", duration: "duration", instructions: "instructions" }
    : { appointment_date: "date", purpose: "purpose", location: "location", status: "status", notes: "notes" };
  const update = (field) => (event) => onChange((current) => ({ ...current, [field]: event.target.value }));
  const errorFor = (field) => (fieldErrors[field] ? t("doctorPlanResources.fieldInvalid") : undefined);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-bold">{t(`${root}.title`)}</h4>
        <Button variant="secondary" size="sm" onClick={onCreate}>{t(`${root}.create`)}</Button>
      </div>
      <div className="mt-4">
        {resource.loading ? <LoadingState label={t(`${root}.loading`)} />
          : resource.loadError ? <ErrorState message={t(resource.loadError)} />
            : resource.items.length === 0 ? <EmptyState title={t(`${root}.empty`)} />
              : (
                <ul className="space-y-3">
                  {resource.items.map((item) => (
                    <li key={item.id} className="rounded-lg border border-border bg-background p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{isMedication ? item.medication_name : item.purpose}</p>
                          <p className="mt-1 break-words text-sm text-text-secondary">
                            {isMedication ? `${item.dosage} · ${item.frequency}` : dateTime(item.appointment_date)}
                          </p>
                          {isMedication ? (
                            <>
                              {item.duration && <p className="mt-2 text-sm text-text-secondary">{t(`${root}.fields.duration`)}: {item.duration}</p>}
                              {item.instructions && <p className="mt-2 whitespace-pre-wrap text-sm">{item.instructions}</p>}
                            </>
                          ) : (
                            <>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                                <StatusBadge status={item.status} labelPrefix={`${root}.statusValues`} />
                                {item.location && <span>{item.location}</span>}
                              </div>
                              {item.notes && <p className="mt-2 whitespace-pre-wrap text-sm">{item.notes}</p>}
                            </>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" size="sm" onClick={() => onEdit(item)}>{t(`${root}.edit`)}</Button>
                          <ConfirmAction
                            size="sm"
                            label={t(`${root}.delete`)}
                            title={t(`${root}.confirmDelete`)}
                            confirmLabel={t("doctorPlanResources.confirm")}
                            cancelLabel={t("doctorPlanResources.cancel")}
                            loading={busyDelete === `${kind}-${item.id}`}
                            onConfirm={() => onDelete(kind, item)}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
      </div>
      {(mode === "create" || mode === "edit") && (
        <form onSubmit={onSave} className="mt-5 space-y-3 border-t border-border pt-5">
          <h5 className="font-semibold">{t(`${root}.${mode === "edit" ? "editTitle" : "createTitle"}`)}</h5>
          {fields.map((field) => {
            const label = t(`${root}.fields.${fieldKeys[field]}`);
            if (field === "instructions" || field === "notes") {
              return <TextareaField key={field} label={label} rows={3} value={draft[field] || ""} onChange={update(field)} error={errorFor(field)} />;
            }
            if (field === "status") {
              return (
                <SelectField
                  key={field}
                  label={label}
                  value={draft.status}
                  onChange={update("status")}
                  options={Object.entries(t(`${root}.statusValues`, { returnObjects: true })).map(([value, optionLabel]) => ({ value, label: optionLabel }))}
                />
              );
            }
            return (
              <TextField
                key={field}
                label={label}
                required={field !== "duration" && field !== "location"}
                type={field === "appointment_date" ? "datetime-local" : "text"}
                step={field === "appointment_date" ? 1 : undefined}
                value={field === "appointment_date" ? appointmentInputValue(draft[field]) : draft[field] || ""}
                onChange={update(field)}
                error={errorFor(field)}
              />
            );
          })}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="sm" loading={saving} loadingText={t("doctorPlanResources.saving")}>{t(`${root}.save`)}</Button>
            <Button variant="secondary" size="sm" onClick={onCancel}>{t("doctorPlanResources.cancel")}</Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default TreatmentPlanResourcesSection;
