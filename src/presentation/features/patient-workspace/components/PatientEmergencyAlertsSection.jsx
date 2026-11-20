import { useState } from "react";

function PatientEmergencyAlertsSection({ t, alerts, alertsLoading, alertsError, onRetryAlerts, onOpenDialog, cancelError, cancelNotice, cancellingAlertId, onCancelAlert }) {
  const [confirmingAlertId, setConfirmingAlertId] = useState(null);

  return (
    <section id="emergency-alerts" className="mt-8 rounded-2xl border border-danger/30 bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-danger">{t("patientWorkspace.emergency")}</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{t("patientWorkspace.emergencyHint")}</p>
        </div>
        <button type="button" onClick={onOpenDialog} className="min-h-11 rounded-xl bg-danger px-5 py-2 font-semibold text-white">{t("patientWorkspace.sendAlert")}</button>
      </div>
      {alertsError && <div role="alert" className="mt-4 rounded-xl bg-danger/10 p-4 text-sm text-danger"><p>{alertsError}</p><button type="button" onClick={onRetryAlerts} disabled={alertsLoading} className="mt-3 min-h-10 rounded-lg border border-danger px-3 py-2 font-semibold disabled:opacity-60">{t("patientWorkspace.retry")}</button></div>}
      <div className="mt-6"><h3 className="font-bold">{t("patientWorkspace.myAlerts")}</h3>
        {cancelError && <p role="alert" className="mt-3 rounded-lg bg-danger/10 p-3 text-sm text-danger">{cancelError}</p>}
        {cancelNotice && <p role="status" className="mt-3 rounded-lg bg-primary/10 p-3 text-sm text-primary">{cancelNotice}</p>}
        {alertsLoading ? <p className="mt-3 text-sm text-text-secondary">{t("patientWorkspace.alertsLoading")}</p>
          : alertsError ? null
            : alerts.length > 0 ? <ul className="mt-3 space-y-3">{alerts.map((alert) => <li key={alert.id} className="rounded-lg border border-border bg-background px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>{t(`patientWorkspace.alertStatuses.${alert.status}`, { defaultValue: alert.status })} · {new Date(alert.sent_at).toLocaleString()}</p>
                {alert.status === "PENDING_ASSIGNMENT" && confirmingAlertId !== alert.id && <button type="button" onClick={() => setConfirmingAlertId(alert.id)} disabled={cancellingAlertId !== null} className="min-h-10 rounded-lg border border-danger px-3 py-2 font-semibold text-danger hover:bg-danger/5 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger">{t("patientWorkspace.cancelAlert")}</button>}
              </div>
              {alert.status === "PENDING_ASSIGNMENT" && confirmingAlertId === alert.id && <div role="group" aria-labelledby={`cancel-alert-title-${alert.id}`} aria-describedby={`cancel-alert-description-${alert.id}`} className="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-4">
                <h4 id={`cancel-alert-title-${alert.id}`} className="font-semibold">{t("patientWorkspace.cancelAlertTitle")}</h4>
                <p id={`cancel-alert-description-${alert.id}`} className="mt-2 text-text-secondary">{t("patientWorkspace.cancelAlertConfirmation")}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={() => { setConfirmingAlertId(null); onCancelAlert(alert.id); }} disabled={cancellingAlertId === alert.id} className="min-h-10 rounded-lg bg-danger px-4 py-2 font-semibold text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger">{cancellingAlertId === alert.id ? t("patientWorkspace.cancellingAlert") : t("patientWorkspace.confirmCancelAlert")}</button>
                  <button type="button" onClick={() => setConfirmingAlertId(null)} disabled={cancellingAlertId === alert.id} className="min-h-10 rounded-lg border border-border px-4 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{t("patientWorkspace.keepAlert")}</button>
                </div>
              </div>}
            </li>)}</ul>
              : <p className="mt-3 text-sm text-text-secondary">{t("patientWorkspace.noAlerts")}</p>}
      </div>
    </section>
  );
}

export default PatientEmergencyAlertsSection;
