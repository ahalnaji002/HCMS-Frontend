function EmergencyAlertsSection({ t, alerts, doctors, selectedDoctorIds, onDoctorChange, busyId, onAssign }) {
  return (
    <section id="admin-emergencies" className="mt-8 rounded-2xl border border-danger/30 bg-surface p-6 sm:p-8">
      <h2 className="text-xl font-bold text-danger">{t("adminIntakes.emergencyTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{t("adminIntakes.emergencyDescription")}</p>
      {alerts.length === 0 ? <p className="mt-5 text-sm text-text-secondary">{t("adminIntakes.noEmergencies")}</p> : <div className="mt-5 space-y-4">
        {alerts.map((alert) => <article key={alert.id} className="rounded-xl border border-border bg-background p-5">
          <div className="flex flex-wrap justify-between gap-2"><p className="font-bold">{alert.phone} · {alert.location || "—"}</p><span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">{t(`patientWorkspace.alertStatuses.${alert.status}`, { defaultValue: alert.status })}</span></div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{alert.description || "—"}</p>
          <p className="mt-2 text-xs text-text-secondary">{new Date(alert.sent_at).toLocaleString()}</p>
          {alert.status === "PENDING_ASSIGNMENT" && <div className="mt-4 flex flex-wrap gap-3">
            <select aria-label={t("adminIntakes.emergencyDoctor")} value={selectedDoctorIds[alert.id] || ""} onChange={(event) => onDoctorChange(alert.id, event.target.value)} className="min-w-64 rounded-lg border border-border bg-surface px-3 py-2">
              <option value="">{t("adminIntakes.selectDoctor")}</option>
              {doctors.filter((doctor) => ["General Medicine", "Emergency Medicine"].includes(doctor.specialization)).map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.full_name} — {doctor.specialization} ({t(`adminIntakes.availabilityValues.${doctor.availability}`)}; {doctor.active_assignment_count}/{doctor.capacity_limit ?? "∞"})</option>)}
            </select>
            <button type="button" disabled={busyId === `emergency-${alert.id}`} onClick={() => onAssign(alert)} className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busyId === `emergency-${alert.id}` ? t("adminIntakes.working") : t("adminIntakes.assignEmergency")}</button>
          </div>}
        </article>)}
      </div>}
    </section>
  );
}

export default EmergencyAlertsSection;
