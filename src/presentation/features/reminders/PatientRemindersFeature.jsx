import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";

function localDateTimeValue(date = new Date()) {
  const part = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}:${part(date.getSeconds())}`;
}

function exactLocalDateTime(value) {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  return value;
}

function isFutureLocalDateTime(value) {
  const exact = exactLocalDateTime(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(exact);
  if (!match) return false;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute, second);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
    && date.getHours() === hour
    && date.getMinutes() === minute
    && date.getSeconds() === second
    && date.getTime() > Date.now();
}

function formatLocalDateTime(value, locale) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return value;
  const [, year, month, day, hour, minute, second = "0"] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  return new Intl.DateTimeFormat(locale || undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getLoadErrorKind(error) {
  if (!error.response) return "network";
  if (error.response.status === 401) return "unauthorized";
  if (error.response.status === 403) return "forbidden";
  return "loadFailed";
}

function PatientRemindersFeature() {
  const { t, i18n } = useTranslation();
  const { reminders, patientWorkspace } = useApplicationServices();
  const [listState, setListState] = useState({ loading: true, error: "", reminders: [] });
  const [referenceState, setReferenceState] = useState({ loading: true, error: "", medication: [], appointment: [] });
  const [reloadKey, setReloadKey] = useState(0);
  const [referenceReloadKey, setReferenceReloadKey] = useState(0);
  const [type, setType] = useState("MEDICATION");
  const [referenceId, setReferenceId] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let active = true;
    reminders.listOwnReminders()
      .then((response) => {
        if (active) setListState({ loading: false, error: "", reminders: response?.data?.reminders ?? [] });
      })
      .catch((error) => {
        if (active) setListState({ loading: false, error: getLoadErrorKind(error), reminders: [] });
      });
    return () => { active = false; };
  }, [reminders, reloadKey]);

  useEffect(() => {
    let active = true;
    async function loadReferences() {
      try {
        const plansResponse = await patientWorkspace.listOwnTreatmentPlans();
        const plans = plansResponse?.data?.treatment_plans ?? [];
        const planReferences = await Promise.all(plans.map(async (plan) => {
          const [medicationResponse, appointmentResponse] = await Promise.all([
            patientWorkspace.listOwnTreatmentPlanMedications(plan.id),
            patientWorkspace.listOwnTreatmentPlanAppointments(plan.id),
          ]);
          const medications = (medicationResponse?.data?.medications ?? []).map((item) => ({
            type: "MEDICATION",
            id: String(item.id),
            planTitle: plan.title,
            label: `${item.medication_name} — ${plan.title}`,
          }));
          const appointments = (appointmentResponse?.data?.appointments ?? []).map((item) => ({
            type: "APPOINTMENT",
            id: String(item.id),
            planTitle: plan.title,
            label: `${item.purpose} — ${formatLocalDateTime(item.appointment_date, i18n.language)} — ${plan.title}`,
          }));
          return { medications, appointments };
        }));
        if (!active) return;
        setReferenceState({
          loading: false,
          error: "",
          medication: planReferences.flatMap((references) => references.medications),
          appointment: planReferences.flatMap((references) => references.appointments),
        });
      } catch (error) {
        if (active) setReferenceState({ loading: false, error: getLoadErrorKind(error), medication: [], appointment: [] });
      }
    }
    loadReferences();
    return () => { active = false; };
  }, [patientWorkspace, referenceReloadKey, i18n.language]);

  const availableReferences = useMemo(() => referenceState[type.toLowerCase()] ?? [], [referenceState, type]);
  const referenceLabelByKey = useMemo(() => {
    const allReferences = [...referenceState.medication, ...referenceState.appointment];
    return new Map(allReferences.map((item) => [`${item.type ?? ""}:${item.id}`, item.label]));
  }, [referenceState]);

  function reloadReminders() {
    setListState((current) => ({ ...current, loading: true, error: "" }));
    setReloadKey((key) => key + 1);
  }

  function retryReferences() {
    setReferenceState((current) => ({ ...current, loading: true, error: "" }));
    setReferenceReloadKey((key) => key + 1);
  }

  function handleTypeChange(event) {
    setType(event.target.value);
    setReferenceId("");
    setFormError("");
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!referenceId) {
      setFormError("referenceRequired");
      return;
    }
    if (!isFutureLocalDateTime(remindAt)) {
      setFormError("futureDateRequired");
      return;
    }

    setSaving(true);
    setFormError("");
    setActionError("");
    setNotice("");
    try {
      await reminders.createOwnReminder({
        type,
        reference_id: referenceId,
        remind_at: exactLocalDateTime(remindAt),
      });
      setReferenceId("");
      setRemindAt("");
      setNotice("created");
      reloadReminders();
    } catch (error) {
      if (error.response?.status === 400) setFormError("validation");
      else if (error.response?.status === 403) setFormError("forbidden");
      else if (error.response?.status === 404) setFormError("referenceNotFound");
      else if (error.response?.status === 409) setFormError("stateConflict");
      else setFormError(error.response ? "createFailed" : "network");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(reminder) {
    if (reminder.status !== "PENDING" || busyId) return;
    setBusyId(String(reminder.id));
    setActionError("");
    setNotice("");
    try {
      const response = await reminders.cancelOwnReminder(reminder.id);
      const updated = response?.data?.reminder ?? { ...reminder, status: "CANCELLED" };
      setListState((current) => ({
        ...current,
        reminders: current.reminders.map((item) => String(item.id) === String(reminder.id) ? updated : item),
      }));
      setNotice("cancelled");
    } catch (error) {
      if (error.response?.status === 409) {
        setActionError("stateConflict");
        reloadReminders();
      } else if (error.response?.status === 404) setActionError("notFound");
      else if (error.response?.status === 401) setActionError("unauthorized");
      else if (error.response?.status === 403) setActionError("forbidden");
      else setActionError(error.response ? "actionFailed" : "network");
    } finally {
      setBusyId("");
    }
  }

  const unreadStatus = listState.reminders.filter((item) => item.status === "PENDING").length;

  return (
    <section aria-labelledby="reminders-title" className="mx-auto max-w-5xl">
      <header className="mb-7">
        <p className="text-sm font-semibold text-primary">{t("reminders.eyebrow")}</p>
        <h1 id="reminders-title" className="mt-2 text-3xl font-bold">{t("roleNavigation.patient.reminders")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">{t("reminders.description")}</p>
      </header>

      {actionError && <p role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{t(`reminders.errors.${actionError}`)}</p>}
      {notice && <p role="status" className="mb-5 rounded-xl bg-primary/10 p-4 text-sm text-primary">{t(`reminders.notices.${notice}`)}</p>}

      <section aria-labelledby="reminders-create-title" className="mb-8 rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <h2 id="reminders-create-title" className="text-xl font-bold">{t("reminders.createTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{t("reminders.localTimeHelp")}</p>
        {formError && <p role="alert" className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{t(`reminders.errors.${formError}`)}</p>}
        {referenceState.error && <div role="alert" className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">
          <p>{t(`reminders.errors.${referenceState.error}`)}</p>
          <button type="button" onClick={retryReferences} disabled={referenceState.loading} className="mt-2 min-h-10 rounded-lg border border-danger px-3 py-2 font-semibold disabled:opacity-60">{t("reminders.retry")}</button>
        </div>}
        <form onSubmit={handleCreate} className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="reminder-type" className="mb-2 block text-sm font-semibold">{t("reminders.typeLabel")}</label>
            <select id="reminder-type" value={type} onChange={handleTypeChange} disabled={referenceState.loading || saving} className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm">
              <option value="MEDICATION">{t("reminders.types.MEDICATION")}</option>
              <option value="APPOINTMENT">{t("reminders.types.APPOINTMENT")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="reminder-reference" className="mb-2 block text-sm font-semibold">{t(type === "MEDICATION" ? "reminders.medicationLabel" : "reminders.appointmentLabel")}</label>
            <select id="reminder-reference" value={referenceId} onChange={(event) => { setReferenceId(event.target.value); setFormError(""); }} required disabled={referenceState.loading || Boolean(referenceState.error) || availableReferences.length === 0 || saving} className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm disabled:opacity-60">
              <option value="">{referenceState.loading ? t("reminders.loadingReferences") : t("reminders.selectReference")}</option>
              {availableReferences.map((reference) => <option key={reference.id} value={reference.id}>{reference.label}</option>)}
            </select>
            {!referenceState.loading && !referenceState.error && availableReferences.length === 0 && <p className="mt-2 text-xs text-text-secondary">{t("reminders.noReferences")}</p>}
          </div>
          <div>
            <label htmlFor="remind-at" className="mb-2 block text-sm font-semibold">{t("reminders.dateLabel")}</label>
            <input id="remind-at" type="datetime-local" step="1" min={localDateTimeValue()} value={remindAt} onChange={(event) => { setRemindAt(event.target.value); setFormError(""); }} required disabled={saving} className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm" />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={saving || referenceState.loading || Boolean(referenceState.error) || availableReferences.length === 0} className="min-h-12 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? t("reminders.creating") : t("reminders.create")}
            </button>
          </div>
        </form>
      </section>

      <section aria-labelledby="reminders-list-title" className="rounded-2xl border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5 sm:p-6">
          <div><h2 id="reminders-list-title" className="text-xl font-bold">{t("reminders.listTitle")}</h2><p className="mt-1 text-sm text-text-secondary">{t("reminders.pendingCount", { count: unreadStatus })}</p></div>
          <button type="button" onClick={reloadReminders} disabled={listState.loading} className="min-h-10 rounded-lg border border-border px-3 py-2 text-sm font-semibold disabled:opacity-60">{t("reminders.refresh")}</button>
        </div>
        {listState.loading ? <p role="status" className="p-6 text-sm text-text-secondary">{t("reminders.loading")}</p>
          : listState.error ? <div role="alert" className="p-6">
            <p className="text-sm text-danger">{t(`reminders.errors.${listState.error}`)}</p>
            <button type="button" onClick={reloadReminders} className="mt-4 min-h-10 rounded-lg border border-border px-3 py-2 text-sm font-semibold">{t("reminders.retry")}</button>
          </div>
            : listState.reminders.length === 0 ? <p role="status" className="p-6 text-sm text-text-secondary">{t("reminders.empty")}</p>
              : <ul className="divide-y divide-border">{listState.reminders.map((reminder) => {
                const referenceKey = `${reminder.type}:${String(reminder.reference_id)}`;
                const referenceLabel = referenceLabelByKey.get(referenceKey);
                const isPending = reminder.status === "PENDING";
                const isBusy = busyId === String(reminder.id);
                return <li key={reminder.id} className="p-5 sm:p-6">
                  <article className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{referenceLabel || t("reminders.referenceFallback", { type: t(`reminders.types.${reminder.type}`), id: reminder.reference_id })}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isPending ? "bg-warning/10 text-warning" : "bg-background text-text-secondary"}`}>{t(`reminders.statuses.${reminder.status}`, { defaultValue: reminder.status })}</span>
                      </div>
                      <p className="mt-2 text-sm text-text-secondary">{t(`reminders.types.${reminder.type}`)}</p>
                      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <div><dt className="inline font-semibold">{t("reminders.scheduledFor")}: </dt><dd className="inline"><time dateTime={reminder.remind_at}>{formatLocalDateTime(reminder.remind_at, i18n.language)}</time></dd></div>
                        {reminder.sent_at && <div><dt className="inline font-semibold">{t("reminders.sentAt")}: </dt><dd className="inline"><time dateTime={reminder.sent_at}>{formatLocalDateTime(reminder.sent_at, i18n.language)}</time></dd></div>}
                      </dl>
                    </div>
                    {isPending && <button type="button" onClick={() => handleCancel(reminder)} disabled={Boolean(busyId)} className="min-h-10 shrink-0 self-start rounded-lg border border-border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">{isBusy ? t("reminders.cancelling") : t("reminders.cancel")}</button>}
                  </article>
                </li>;
              })}</ul>}
      </section>
    </section>
  );
}

export default PatientRemindersFeature;
