function PatientEmergencyAlertsSection({ t, alerts, alertsLoading, alertsError, onRetryAlerts, onOpenDialog }) {
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
        {alertsLoading ? <p className="mt-3 text-sm text-text-secondary">{t("patientWorkspace.alertsLoading")}</p>
          : alertsError ? null
            : alerts.length > 0 ? <ul className="mt-3 space-y-2">{alerts.map((alert) => <li key={alert.id} className="rounded-lg border border-border bg-background px-4 py-3 text-sm">{t(`patientWorkspace.alertStatuses.${alert.status}`, { defaultValue: alert.status })} · {new Date(alert.sent_at).toLocaleString()}</li>)}</ul>
              : <p className="mt-3 text-sm text-text-secondary">{t("patientWorkspace.noAlerts")}</p>}
      </div>
    </section>
  );
}

export default PatientEmergencyAlertsSection;
