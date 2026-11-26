import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import EmergencyAlertContact from "@/presentation/components/common/EmergencyAlertContact";
import {
  Button, Card, ConfirmAction, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, useToast,
} from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";
import { serverMessageKey } from "@/presentation/utils/serverMessages";

// FR-6.4: the assigned Doctor moves an alert ASSIGNED -> IN_PROGRESS -> RESOLVED.
const NEXT_STATUS = { ASSIGNED: "IN_PROGRESS", IN_PROGRESS: "RESOLVED" };
const ACTIVE_STATUSES = new Set(["ASSIGNED", "IN_PROGRESS"]);

function actionErrorKey(error) {
  const status = error.response?.status;
  const key = serverMessageKey(error.response?.data?.message);
  if (key && status !== 400) return key;
  if (status === 409) return "doctorEmergency.errors.conflict";
  if (status === 404) return "serverMessages.emergencyNotFound";
  if (status === 400) return "serverMessages.validationFailed";
  if (!error.response) return "doctorEmergency.errors.network";
  return "doctorEmergency.errors.server";
}

function AlertTimeline({ t, alert }) {
  const { dateTime } = useFormatDate();
  const rows = [
    ["sentAt", alert.sent_at],
    ["assignedAt", alert.assigned_at],
    ["respondedAt", alert.responded_at],
    ["resolvedAt", alert.resolved_at],
  ].filter(([, value]) => dateTime(value));
  return (
    <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-text-secondary sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-2">
          <dt>{t(`doctorEmergency.times.${label}`)}:</dt>
          <dd>{dateTime(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function DoctorEmergencyAlertCard({ t, alert, busy, disabled, onAdvance }) {
  const nextStatus = NEXT_STATUS[alert.status];
  const active = ACTIVE_STATUSES.has(alert.status);

  return (
    <Card
      as="article"
      padding="sm"
      titleLevel={3}
      tone={active ? "danger" : "default"}
      title={alert.patient_name || t("doctorEmergency.visitor")}
      actions={<StatusBadge status={alert.status} labelPrefix="patientWorkspace.alertStatuses" />}
    >
      <EmergencyAlertContact t={t} phone={alert.phone} location={alert.location} />
      {alert.patient_phone && alert.patient_phone !== alert.phone && (
        <p className="mt-1 text-sm text-text-secondary">
          {t("doctorEmergency.accountPhone")}{" "}
          <a href={`tel:${alert.patient_phone}`} dir="ltr" className="underline underline-offset-4">{alert.patient_phone}</a>
        </p>
      )}
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{alert.description || t("doctorEmergency.noDescription")}</p>
      <AlertTimeline t={t} alert={alert} />

      {nextStatus === "IN_PROGRESS" && (
        <Button variant="danger" className="mt-4" loading={busy} loadingText={t("doctorEmergency.working")} disabled={disabled} onClick={() => onAdvance(alert, nextStatus)}>
          {t("doctorEmergency.start")}
        </Button>
      )}
      {nextStatus === "RESOLVED" && (
        <div className="mt-4">
          <ConfirmAction
            tone="primary"
            label={t("doctorEmergency.resolve")}
            title={t("doctorEmergency.resolveTitle")}
            description={t("doctorEmergency.resolveConfirmation")}
            confirmLabel={t("doctorEmergency.confirmResolve")}
            cancelLabel={t("doctorEmergency.keepOpen")}
            loading={busy}
            disabled={disabled}
            onConfirm={() => onAdvance(alert, nextStatus)}
          />
        </div>
      )}
    </Card>
  );
}

function DoctorEmergencyAlertsPage() {
  const { t } = useTranslation();
  const { doctorWorkspace } = useApplicationServices();
  const toast = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState(null);

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
    try {
      const response = await doctorWorkspace.updateEmergencyAlertStatus(alert.id, nextStatus);
      const updated = response.data.emergency_alert;
      setAlerts((current) => current.map((item) => (item.id === alert.id ? { ...item, ...updated } : item)));
      toast.success({ key: nextStatus === "IN_PROGRESS" ? "doctorEmergency.started" : "doctorEmergency.resolved" });
    } catch (error) {
      toast.error({ key: actionErrorKey(error) });
      // The alert changed on the server (or is no longer ours): show its real state.
      if ([404, 409].includes(error.response?.status)) loadAlerts();
    } finally {
      setBusyId(null);
    }
  }

  const activeAlerts = alerts.filter((alert) => ACTIVE_STATUSES.has(alert.status));
  const closedAlerts = alerts.filter((alert) => !ACTIVE_STATUSES.has(alert.status));
  const renderCards = (list) => (
    <div className="space-y-4">
      {list.map((alert) => (
        <DoctorEmergencyAlertCard key={alert.id} t={t} alert={alert} busy={busyId === alert.id} disabled={busyId !== null} onAdvance={advance} />
      ))}
    </div>
  );

  return (
    <>
      <PageHeader
        id="doctor-emergency-alerts"
        title={t("roleNavigation.doctor.emergencyAlerts")}
        description={t("doctorEmergency.description")}
        actions={<Button variant="secondary" onClick={loadAlerts} disabled={loading}>{t("doctorEmergency.refresh")}</Button>}
      />

      {loading && alerts.length === 0 ? <LoadingState label={t("doctorEmergency.loading")} />
        : loadError ? <ErrorState message={loadError} onRetry={loadAlerts} retryLabel={t("doctorEmergency.retry")} />
          : (
            <>
              <Card title={t("doctorEmergency.activeTitle")} tone="danger">
                {activeAlerts.length === 0 ? <EmptyState title={t("doctorEmergency.noActive")} /> : renderCards(activeAlerts)}
              </Card>
              {closedAlerts.length > 0 && (
                <Card title={t("doctorEmergency.closedTitle")} className="mt-8">
                  {renderCards(closedAlerts)}
                </Card>
              )}
            </>
          )}
    </>
  );
}

export default DoctorEmergencyAlertsPage;
