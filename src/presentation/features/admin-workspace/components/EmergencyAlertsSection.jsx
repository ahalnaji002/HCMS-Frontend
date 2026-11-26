import EmergencyAlertContact from "@/presentation/components/common/EmergencyAlertContact";

function EmergencyAlertsSection({ t, alerts, doctors, selectedDoctorIds, busyId, loading, loadError, onDoctorChange, onRefresh, onAssign }) {
  const eligibleDoctors = doctors.filter((doctor) => ["General Medicine", "Emergency Medicine"].includes(doctor.specialization));
  return (
    <section id="admin-emergencies" className="mt-8 rounded-2xl border border-danger/30 bg-surface p-6 sm:p-8">
      <h1 className="text-xl font-bold text-danger">{t("adminIntakes.emergencyTitle")}</h1>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{t("adminIntakes.emergencyDescription")}</p>
      {loading ? <p role="status" className="mt-5 text-sm text-text-secondary">{t("adminIntakes.emergencyLoading")}</p> : loadError ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
          <p role="alert" className="text-sm text-danger">{t("adminIntakes.emergencyLoadError")}</p>
          <button type="button" onClick={onRefresh} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">{t("adminIntakes.retry")}</button>
        </div>
      ) : alerts.length === 0 ? <p className="mt-5 text-sm text-text-secondary">{t("adminIntakes.noEmergencies")}</p> : <div className="mt-5 space-y-4">
        {alerts.map((alert) => <article key={alert.id} className="rounded-xl border border-border bg-background p-5">
          <div className="flex flex-wrap justify-between gap-2"><EmergencyAlertContact t={t} phone={alert.phone} location={alert.location} /><span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">{t(`patientWorkspace.alertStatuses.${alert.status}`, { defaultValue: alert.status })}</span></div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{alert.description || "—"}</p>
          {alert.sent_at && !Number.isNaN(Date.parse(alert.sent_at)) && <p className="mt-2 text-xs text-text-secondary">{new Date(alert.sent_at).toLocaleString()}</p>}
          {alert.status === "PENDING_ASSIGNMENT" && <div className="mt-4 flex flex-wrap gap-3">
            <select aria-label={t("adminIntakes.emergencyDoctor")} value={selectedDoctorIds[alert.id] || ""} onChange={(event) => onDoctorChange(alert.id, event.target.value)} className="min-w-64 rounded-lg border border-border bg-surface px-3 py-2">
              <option value="">{t("adminIntakes.selectDoctor")}</option>
              {eligibleDoctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.full_name} — {doctor.specialization} ({t(`adminIntakes.availabilityValues.${doctor.availability}`)}; {doctor.active_assignment_count}/{doctor.capacity_limit ?? "∞"})</option>)}
            </select>
            <button type="button" disabled={busyId === `emergency-${alert.id}` || eligibleDoctors.length === 0} onClick={() => onAssign(alert)} className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busyId === `emergency-${alert.id}` ? t("adminIntakes.working") : t("adminIntakes.assignEmergency")}</button>
            {eligibleDoctors.length === 0 && <p className="w-full text-sm text-text-secondary">{t("adminIntakes.noEmergencyDoctors")}</p>}
          </div>}
        </article>)}
      </div>}
    </section>
  );
}

export default EmergencyAlertsSection;
