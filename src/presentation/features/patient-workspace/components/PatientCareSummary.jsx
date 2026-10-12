function PatientCareSummary({ t, assignments, diagnoses, intake, profile }) {
  return (
    <>
      {assignments.length > 0 && <section className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-bold">{t("patientWorkspace.assignedDoctors")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">{assignments.map((assignment) => <div key={assignment.id} className="rounded-xl border border-border bg-background p-4"><p className="font-bold">{assignment.doctor_name}</p><p className="mt-1 text-sm text-text-secondary">{assignment.specialization}</p><p className="mt-3 text-sm">{t("patientWorkspace.assignmentStatus")}: {t("patientWorkspace.active")}</p><p className="mt-1 text-sm text-text-secondary">{t("patientWorkspace.assignmentNextStep")}</p></div>)}</div>
      </section>}
      {intake?.status === "DOCTOR_ASSIGNED" && <section className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-bold">{t("patientWorkspace.diagnosesTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{t("patientWorkspace.diagnosesDescription")}</p>
        {diagnoses.length ? <div className="mt-5 space-y-4">{diagnoses.map((diagnosis) => <article key={diagnosis.id} className="rounded-xl border border-border bg-background p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-bold">{diagnosis.doctor_name} · {diagnosis.specialization}</p><time className="text-xs text-text-secondary">{new Date(diagnosis.documented_at).toLocaleString()}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{diagnosis.diagnosis}</p></article>)}</div> : <p className="mt-5 text-sm text-text-secondary">{t("patientWorkspace.noDiagnoses")}</p>}
      </section>}
      <section id="patient-profile" className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-bold">{t("patientWorkspace.profile")}</h2>
        {profile ? <div className="mt-5 grid gap-4 sm:grid-cols-2"><ReadOnlyField label={t("patientWorkspace.profileName")} value={profile.full_name} /><ReadOnlyField label={t("patientWorkspace.profileEmail")} value={profile.email} /><ReadOnlyField label={t("patientWorkspace.profilePhone")} value={profile.phone} /><ReadOnlyField label={t("patientWorkspace.profileAddress")} value={profile.address} /></div> : <p className="mt-4 text-sm text-text-secondary">{t("patientWorkspace.profileLoading")}</p>}
      </section>
    </>
  );
}

function ReadOnlyField({ label, value }) {
  return <div className="rounded-xl border border-border bg-background p-4"><p className="text-xs font-semibold text-text-secondary">{label}</p><p className="mt-2 break-words text-sm leading-6">{value || "—"}</p></div>;
}

export default PatientCareSummary;
