import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import EmergencyAlertContact from "@/presentation/components/common/EmergencyAlertContact";
import StatusToast from "@/presentation/components/common/StatusToast";
import { serverMessageKey } from "@/presentation/utils/serverMessages";

// FR-6.4: the assigned Doctor moves an alert ASSIGNED -> IN_PROGRESS -> RESOLVED.
const NEXT_STATUS = { ASSIGNED: "IN_PROGRESS", IN_PROGRESS: "RESOLVED" };
const ACTIVE_STATUSES = new Set(["ASSIGNED", "IN_PROGRESS"]);

function formatTime(value) {
  return value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString() : null;
}

function actionErrorMessage(error, t) {
  const status = error.response?.status;
  const key = serverMessageKey(error.response?.data?.message);
  if (key && status !== 400) return t(key);
  if (status === 409) return t("doctorEmergency.errors.conflict");
  if (status === 404) return t("serverMessages.emergencyNotFound");
  if (status === 400) return t("serverMessages.validationFailed");
  if (!error.response) return t("doctorEmergency.errors.network");
  return t("doctorEmergency.errors.server");
}

function AlertTimeline({ t, alert }) {
  const rows = [
    ["sentAt", alert.sent_at],
    ["assignedAt", alert.assigned_at],
    ["respondedAt", alert.responded_at],
    ["resolvedAt", alert.resolved_at],
  ].filter(([, value]) => formatTime(value));
  return (
    <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-text-secondary sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-2">
          <dt>{t(`doctorEmergency.times.${label}`)}:</dt>
          <dd dir="ltr">{formatTime(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function DoctorEmergencyAlertCard({ t, alert, busy, disabled, onAdvance }) {
  const [confirming, setConfirming] = useState(false);
  const nextStatus = NEXT_STATUS[alert.status];
  const active = ACTIVE_STATUSES.has(alert.status);

  return (
    <article
      aria-labelledby={`doctor-alert-${alert.id}-title`}
      className={`rounded-xl border bg-background p-5 ${active ? "border-danger/40" : "border-border"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id={`doctor-alert-${alert.id}-title`} className="text-lg font-bold">
            {alert.patient_name || t("doctorEmergency.visitor")}
          </h3>
          <EmergencyAlertContact t={t} phone={alert.phone} location={alert.location} />
          {alert.patient_phone && alert.patient_phone !== alert.phone && (
            <p className="mt-1 text-sm text-text-secondary">
              {t("doctorEmergency.accountPhone")}{" "}
              <a href={`tel:${alert.patient_phone}`} dir="ltr" className="underline underline-offset-4">{alert.patient_phone}</a>
            </p>
          )}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"}`}>
          {t(`patientWorkspace.alertStatuses.${alert.status}`, { defaultValue: alert.status })}
        </span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{alert.description || t("doctorEmergency.noDescription")}</p>
      <AlertTimeline t={t} alert={alert} />

      {nextStatus === "IN_PROGRESS" && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAdvance(alert, nextStatus)}
          className="mt-4 min-h-11 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
        >
          {busy ? t("doctorEmergency.working") : t("doctorEmergency.start")}
        </button>
      )}

      {nextStatus === "RESOLVED" && !confirming && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setConfirming(true)}
          className="mt-4 min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {busy ? t("doctorEmergency.working") : t("doctorEmergency.resolve")}
        </button>
      )}

      {nextStatus === "RESOLVED" && confirming && (
        <div role="group" aria-labelledby={`resolve-alert-${alert.id}-title`} className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <h4 id={`resolve-alert-${alert.id}-title`} className="font-semibold">{t("doctorEmergency.resolveTitle")}</h4>
          <p className="mt-2 text-sm text-text-secondary">{t("doctorEmergency.resolveConfirmation")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={disabled}
              onClick={() => { setConfirming(false); onAdvance(alert, nextStatus); }}
              className="min-h-10 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {t("doctorEmergency.confirmResolve")}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold">
              {t("doctorEmergency.keepOpen")}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function DoctorEmergencyAlertsPage() {
  const { t } = useTranslation();
  const { doctorWorkspace } = useApplicationServices();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  // Applies a list response; `isActive` drops results after unmount.
  const settleLoad = useCallback((request, isActive = () => true) => request
    .then((response) => {
      if (!isActive()) return;
      setAlerts(response.data.emergency_alerts);
      setLoadError("");
    })
    .catch(() => { if (isActive()) setLoadError(t("doctorEmergency.loadError")); })
    .finally(() => { if (isActive()) setLoading(false); }), [t]);

  const loadAlerts = useCallback(() => {
    setLoading(true);
    setLoadError("");
    return settleLoad(doctorWorkspace.listAssignedEmergencyAlerts());
  }, [doctorWorkspace, settleLoad]);

  useEffect(() => {
    let active = true;
    settleLoad(doctorWorkspace.listAssignedEmergencyAlerts(), () => active);
    return () => { active = false; };
  }, [doctorWorkspace, settleLoad]);

  async function advance(alert, nextStatus) {
    setBusyId(alert.id);
    setActionError("");
    setActionNotice("");
    try {
      const response = await doctorWorkspace.updateEmergencyAlertStatus(alert.id, nextStatus);
      const updated = response.data.emergency_alert;
      setAlerts((current) => current.map((item) => (item.id === alert.id ? { ...item, ...updated } : item)));
      setActionNotice(t(nextStatus === "IN_PROGRESS" ? "doctorEmergency.started" : "doctorEmergency.resolved"));
    } catch (error) {
      setActionError(actionErrorMessage(error, t));
      // The alert changed on the server (or is no longer ours): show its real state.
      if ([404, 409].includes(error.response?.status)) loadAlerts();
    } finally {
      setBusyId(null);
    }
  }

  const activeAlerts = alerts.filter((alert) => ACTIVE_STATUSES.has(alert.status));
  const closedAlerts = alerts.filter((alert) => !ACTIVE_STATUSES.has(alert.status));
  const renderCards = (list) => (
    <div className="mt-4 space-y-4">
      {list.map((alert) => (
        <DoctorEmergencyAlertCard
          key={alert.id}
          t={t}
          alert={alert}
          busy={busyId === alert.id}
          disabled={busyId !== null}
          onAdvance={advance}
        />
      ))}
    </div>
  );

  return (
    <>
      <StatusToast
        error={actionError}
        notice={actionNotice}
        onDismiss={() => { setActionError(""); setActionNotice(""); }}
        dismissLabel={t("roleHome.dismissMessage")}
      />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="doctor-emergency-alerts" className="text-3xl font-bold">{t("roleNavigation.doctor.emergencyAlerts")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{t("doctorEmergency.description")}</p>
        </div>
        <button type="button" onClick={loadAlerts} disabled={loading} className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60">
          {t("doctorEmergency.refresh")}
        </button>
      </div>

      {loading && alerts.length === 0 ? (
        <p role="status" className="py-12 text-center text-text-secondary">{t("doctorEmergency.loading")}</p>
      ) : loadError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
          <p role="alert" className="text-sm text-danger">{loadError}</p>
          <button type="button" onClick={loadAlerts} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">{t("doctorEmergency.retry")}</button>
        </div>
      ) : (
        <>
          <section aria-labelledby="doctor-active-alerts" className="rounded-2xl border border-danger/30 bg-surface p-6 sm:p-8">
            <h2 id="doctor-active-alerts" className="text-xl font-bold text-danger">{t("doctorEmergency.activeTitle")}</h2>
            {activeAlerts.length === 0
              ? <p className="mt-4 text-sm text-text-secondary">{t("doctorEmergency.noActive")}</p>
              : renderCards(activeAlerts)}
          </section>
          {closedAlerts.length > 0 && (
            <section aria-labelledby="doctor-closed-alerts" className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <h2 id="doctor-closed-alerts" className="text-xl font-bold">{t("doctorEmergency.closedTitle")}</h2>
              {renderCards(closedAlerts)}
            </section>
          )}
        </>
      )}
    </>
  );
}

export default DoctorEmergencyAlertsPage;
