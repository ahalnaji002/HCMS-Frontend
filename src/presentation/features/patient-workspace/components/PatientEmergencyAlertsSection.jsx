function PatientEmergencyAlertsSection({ t, alerts, form, setForm, error, notice, isSubmitting, onSubmit }) {
  return (
    <section id="emergency-alerts" className="mt-8 rounded-2xl border border-danger/30 bg-surface p-6 sm:p-8">
      <h2 className="text-xl font-bold text-danger">{t("patientWorkspace.emergency")}</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{t("patientWorkspace.emergencyHint")}</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl bg-primary/10 p-4 text-sm text-primary">{notice}</p>}
      <form onSubmit={onSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold">{t("patientWorkspace.alertPhone")}<input required maxLength={30} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 font-normal" /></label>
        <label className="space-y-2 text-sm font-semibold">{t("patientWorkspace.alertLocation")}<input maxLength={255} value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 font-normal" /></label>
        <label className="space-y-2 text-sm font-semibold md:col-span-2">{t("patientWorkspace.alertDescription")}<textarea rows={3} maxLength={10000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 font-normal" /></label>
        <button type="submit" disabled={isSubmitting} className="w-fit rounded-xl bg-danger px-6 py-3 font-semibold text-white disabled:opacity-60">{isSubmitting ? t("patientWorkspace.saving") : t("patientWorkspace.sendAlert")}</button>
      </form>
      {alerts.length > 0 && <div className="mt-6"><h3 className="font-bold">{t("patientWorkspace.myAlerts")}</h3><ul className="mt-3 space-y-2">{alerts.map((alert) => <li key={alert.id} className="rounded-lg border border-border bg-background px-4 py-3 text-sm">{t(`patientWorkspace.alertStatuses.${alert.status}`, { defaultValue: alert.status })} · {new Date(alert.sent_at).toLocaleString()}</li>)}</ul></div>}
    </section>
  );
}

export default PatientEmergencyAlertsSection;
