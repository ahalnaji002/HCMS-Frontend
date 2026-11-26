import { Button, Card, ConfirmAction, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";

function PatientEmergencyAlertsSection({ t, alerts, alertsLoading, alertsError, onRetryAlerts, onOpenDialog, cancellingAlertId, onCancelAlert }) {
  const { dateTime } = useFormatDate();

  return (
    <div id="emergency-alerts">
      <PageHeader
        title={t("patientWorkspace.emergency")}
        description={t("patientWorkspace.emergencyHint")}
        actions={<Button variant="danger" size="lg" onClick={onOpenDialog}>{t("patientWorkspace.sendAlert")}</Button>}
      />
      <Card title={t("patientWorkspace.myAlerts")}>
        {alertsLoading ? <LoadingState label={t("patientWorkspace.alertsLoading")} />
          : alertsError ? <ErrorState message={alertsError} onRetry={onRetryAlerts} retryLabel={t("patientWorkspace.retry")} />
            : alerts.length === 0 ? <EmptyState title={t("patientWorkspace.noAlerts")} />
              : (
                <ul className="space-y-3">
                  {alerts.map((alert) => (
                    <li key={alert.id} className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <StatusBadge status={alert.status} labelPrefix="patientWorkspace.alertStatuses" />
                          <span className="text-text-secondary">{dateTime(alert.sent_at)}</span>
                        </div>
                        {alert.status === "PENDING_ASSIGNMENT" && (
                          <ConfirmAction
                            size="sm"
                            label={t("patientWorkspace.cancelAlert")}
                            title={t("patientWorkspace.cancelAlertTitle")}
                            description={t("patientWorkspace.cancelAlertConfirmation")}
                            confirmLabel={t("patientWorkspace.confirmCancelAlert")}
                            cancelLabel={t("patientWorkspace.keepAlert")}
                            loading={cancellingAlertId === alert.id}
                            disabled={cancellingAlertId !== null}
                            onConfirm={() => onCancelAlert(alert.id)}
                          />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
      </Card>
    </div>
  );
}

export default PatientEmergencyAlertsSection;
