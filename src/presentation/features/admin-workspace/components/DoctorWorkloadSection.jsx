function DoctorWorkloadSection({ t, doctors, drafts, onDraftChange, busyId, onSave }) {
  return (
    <section id="admin-workload" className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="text-xl font-bold">{t("adminIntakes.workloadTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{t("adminIntakes.workloadDescription")}</p>
      {doctors.length === 0 ? <p className="mt-5 text-sm text-text-secondary">{t("adminIntakes.noDoctors")}</p> : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {doctors.map((doctor) => {
            const draft = drafts[doctor.id] || { availability: doctor.availability, capacity_limit: doctor.capacity_limit ?? "" };
            const load = Number(doctor.active_assignment_count || 0);
            const full = doctor.capacity_limit !== null && doctor.capacity_limit !== undefined && load >= Number(doctor.capacity_limit);
            return <article key={doctor.id} className="rounded-xl border border-border bg-background p-5">
              <div className="flex flex-wrap justify-between gap-2"><div><p className="font-bold">{doctor.full_name}</p><p className="text-sm text-text-secondary">{doctor.specialization}</p></div>{full && <span className="h-fit rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">{t("adminIntakes.capacityAlert")}</span>}</div>
              <p className="mt-4 text-sm text-text-secondary">{t("adminIntakes.activeAssignments")}: {load} / {doctor.capacity_limit ?? t("adminIntakes.notConfigured")}</p>
              <p className="mt-1 text-sm text-text-secondary">{t("adminIntakes.openEmergencies")}: {doctor.open_emergency_alert_count || 0}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">{t("adminIntakes.availability")}<select value={draft.availability} onChange={(event) => onDraftChange(doctor.id, { ...draft, availability: event.target.value })} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 font-normal"><option value="AVAILABLE">{t("adminIntakes.available")}</option><option value="UNAVAILABLE">{t("adminIntakes.unavailable")}</option></select></label>
                <label className="text-sm font-semibold">{t("adminIntakes.capacity")}<input type="number" min="0" max="4294967295" value={draft.capacity_limit} onChange={(event) => onDraftChange(doctor.id, { ...draft, capacity_limit: event.target.value })} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 font-normal" /></label>
              </div>
              <button type="button" onClick={() => onSave(doctor)} disabled={busyId === `doctor-${doctor.id}`} className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60">{t("adminIntakes.saveWorkload")}</button>
            </article>;
          })}
        </div>
      )}
    </section>
  );
}

export default DoctorWorkloadSection;
