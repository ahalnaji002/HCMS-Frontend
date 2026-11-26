import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, SelectField, StatusBadge, TextField, useToast } from "@/presentation/components/ui";
import { formatDateTime } from "@/presentation/utils/formatDate";

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

// Reminder times are wall-clock values ("2026-11-18 09:15:00"); formatDateTime
// reads them as local time, so they are never shifted.
function formatLocalDateTime(value, locale) {
  return value ? formatDateTime(value, locale) || value : "";
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
  const toast = useToast();
  const [listState, setListState] = useState({ loading: true, error: "", reminders: [] });
  const [referenceState, setReferenceState] = useState({ loading: true, error: "", medication: [], appointment: [] });
  const [reloadKey, setReloadKey] = useState(0);
  const [referenceReloadKey, setReferenceReloadKey] = useState(0);
  const [type, setType] = useState("MEDICATION");
  const [referenceId, setReferenceId] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [formError, setFormError] = useState("");
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
    try {
      await reminders.createOwnReminder({
        type,
        reference_id: referenceId,
        remind_at: exactLocalDateTime(remindAt),
      });
      setReferenceId("");
      setRemindAt("");
      toast.success({ key: "reminders.notices.created" });
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
    try {
      const response = await reminders.cancelOwnReminder(reminder.id);
      const updated = response?.data?.reminder ?? { ...reminder, status: "CANCELLED" };
      setListState((current) => ({
        ...current,
        reminders: current.reminders.map((item) => String(item.id) === String(reminder.id) ? updated : item),
      }));
      toast.success({ key: "reminders.notices.cancelled" });
    } catch (error) {
      const status = error.response?.status;
      const kind = status === 409 ? "stateConflict" : status === 404 ? "notFound" : status === 401 ? "unauthorized"
        : status === 403 ? "forbidden" : error.response ? "actionFailed" : "network";
      toast.error({ key: `reminders.errors.${kind}` });
      if (status === 409) reloadReminders();
    } finally {
      setBusyId("");
    }
  }

  const unreadStatus = listState.reminders.filter((item) => item.status === "PENDING").length;

  const referenceDisabled = referenceState.loading || Boolean(referenceState.error) || availableReferences.length === 0 || saving;

  return (
    <section aria-labelledby="reminders-title" className="mx-auto max-w-5xl">
      <PageHeader id="reminders-title" eyebrow={t("reminders.eyebrow")} title={t("roleNavigation.patient.reminders")} description={t("reminders.description")} />

      <Card title={t("reminders.createTitle")} description={t("reminders.localTimeHelp")} className="mb-8">
        {formError && <p role="alert" className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{t(`reminders.errors.${formError}`)}</p>}
        {referenceState.error && (
          <ErrorState className="mb-4" message={t(`reminders.errors.${referenceState.error}`)} onRetry={retryReferences} retrying={referenceState.loading} retryLabel={t("reminders.retry")} />
        )}
        <form onSubmit={handleCreate} className="grid items-end gap-5 sm:grid-cols-2">
          <SelectField
            label={t("reminders.typeLabel")}
            value={type}
            onChange={handleTypeChange}
            disabled={referenceState.loading || saving}
            options={[
              { value: "MEDICATION", label: t("reminders.types.MEDICATION") },
              { value: "APPOINTMENT", label: t("reminders.types.APPOINTMENT") },
            ]}
          />
          <SelectField
            label={t(type === "MEDICATION" ? "reminders.medicationLabel" : "reminders.appointmentLabel")}
            value={referenceId}
            onChange={(event) => { setReferenceId(event.target.value); setFormError(""); }}
            required
            disabled={referenceDisabled}
            placeholder={referenceState.loading ? t("reminders.loadingReferences") : t("reminders.selectReference")}
            options={availableReferences.map((reference) => ({ value: reference.id, label: reference.label }))}
            hint={!referenceState.loading && !referenceState.error && availableReferences.length === 0 ? t("reminders.noReferences") : undefined}
          />
          <TextField
            label={t("reminders.dateLabel")}
            type="datetime-local"
            step="1"
            value={remindAt}
            onChange={(event) => { setRemindAt(event.target.value); setFormError(""); }}
            required
            disabled={saving}
          />
          <Button type="submit" fullWidth loading={saving} loadingText={t("reminders.creating")} disabled={referenceState.loading || Boolean(referenceState.error) || availableReferences.length === 0}>
            {t("reminders.create")}
          </Button>
        </form>
      </Card>

      <Card
        title={t("reminders.listTitle")}
        description={t("reminders.pendingCount", { count: unreadStatus })}
        actions={<Button variant="secondary" size="sm" onClick={reloadReminders} disabled={listState.loading}>{t("reminders.refresh")}</Button>}
      >
        {listState.loading ? <LoadingState label={t("reminders.loading")} />
          : listState.error ? <ErrorState message={t(`reminders.errors.${listState.error}`)} onRetry={reloadReminders} retryLabel={t("reminders.retry")} />
            : listState.reminders.length === 0 ? <EmptyState title={t("reminders.empty")} />
              : (
                <ul className="divide-y divide-border">
                  {listState.reminders.map((reminder) => {
                    const referenceLabel = referenceLabelByKey.get(`${reminder.type}:${String(reminder.reference_id)}`);
                    const isPending = reminder.status === "PENDING";
                    return (
                      <li key={reminder.id} className="py-4 first:pt-0 last:pb-0">
                        <article className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold">{referenceLabel || t("reminders.referenceFallback", { type: t(`reminders.types.${reminder.type}`), id: reminder.reference_id })}</h3>
                              <StatusBadge status={reminder.status} tone={isPending ? "warning" : "neutral"} labelPrefix="reminders.statuses" />
                            </div>
                            <p className="mt-2 text-sm text-text-secondary">{t(`reminders.types.${reminder.type}`)}</p>
                            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                              <div><dt className="inline font-semibold">{t("reminders.scheduledFor")}: </dt><dd className="inline"><time dateTime={reminder.remind_at}>{formatLocalDateTime(reminder.remind_at, i18n.language)}</time></dd></div>
                              {reminder.sent_at && <div><dt className="inline font-semibold">{t("reminders.sentAt")}: </dt><dd className="inline"><time dateTime={reminder.sent_at}>{formatLocalDateTime(reminder.sent_at, i18n.language)}</time></dd></div>}
                            </dl>
                          </div>
                          {isPending && (
                            <Button variant="secondary" size="sm" loading={busyId === String(reminder.id)} loadingText={t("reminders.cancelling")} disabled={Boolean(busyId)} onClick={() => handleCancel(reminder)}>
                              {t("reminders.cancel")}
                            </Button>
                          )}
                        </article>
                      </li>
                    );
                  })}
                </ul>
              )}
      </Card>
    </section>
  );
}

export default PatientRemindersFeature;
