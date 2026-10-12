function PatientIntakeQueue({
  t, loading, intakes, doctors, reasons, selectedDoctors, busyId,
  onReasonChange, onDoctorChange, onStartReview, onAssign,
}) {
  if (loading) return <p id="admin-intakes" className="py-12 text-center text-text-secondary">{t("adminIntakes.loading")}</p>;
  if (intakes.length === 0) return <p id="admin-intakes" className="mt-8 rounded-xl border border-border bg-surface p-6 text-text-secondary">{t("adminIntakes.empty")}</p>;

  return (
    <div id="admin-intakes" className="mt-8 space-y-6">
      {intakes.map((intake) => <article key={intake.id} className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{intake.patient_name}</h2><p className="mt-1 text-sm text-text-secondary">{intake.patient_email}</p></div><span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">{t(`patientWorkspace.status.${intake.status}`)}</span></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ReadOnlyField label={t("patientWorkspace.currentProblem")} value={intake.current_problem} />
          <ReadOnlyField label={t("patientWorkspace.symptoms")} value={intake.symptoms} />
          <ReadOnlyField label={t("patientWorkspace.onset")} value={intake.symptom_onset} />
          <ReadOnlyField label={t("patientWorkspace.chronicConditions")} value={answerText(t, intake.chronic_conditions_answer, intake.chronic_conditions_details)} />
          <ReadOnlyField label={t("patientWorkspace.medications")} value={answerText(t, intake.medications_answer, intake.medications_details)} />
          <ReadOnlyField label={t("patientWorkspace.allergies")} value={answerText(t, intake.allergies_answer, intake.allergies_details)} />
          {intake.additional_information && <ReadOnlyField label={t("patientWorkspace.additionalInformation")} value={intake.additional_information} />}
        </div>
        {intake.status === "SUBMITTED" && <button type="button" disabled={busyId === intake.id} onClick={() => onStartReview(intake.id)} className="mt-6 rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">{busyId === intake.id ? t("adminIntakes.working") : t("adminIntakes.startReview")}</button>}
        {["UNDER_REVIEW", "DOCTOR_ASSIGNED"].includes(intake.status) && <div className="mt-6 border-t border-border pt-6">
          <h3 className="font-bold">{t("adminIntakes.assignTitle")}</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold"><span className="block">{t("adminIntakes.doctor")}</span><select value={selectedDoctors[intake.id] || ""} onChange={(event) => onDoctorChange(intake.id, event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 font-normal"><option value="">{t("adminIntakes.selectDoctor")}</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id} disabled={doctor.availability === "UNAVAILABLE"}>{doctor.full_name} — {doctor.specialization} ({t(`adminIntakes.availabilityValues.${doctor.availability}`)}; {doctor.active_assignment_count}/{doctor.capacity_limit ?? "∞"})</option>)}</select></label>
            <label className="space-y-2 text-sm font-semibold"><span className="block">{t("adminIntakes.reason")}</span><input maxLength={255} value={reasons[intake.id] || ""} onChange={(event) => onReasonChange(intake.id, event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 font-normal" /></label>
          </div>
          <p className="mt-3 text-sm leading-6 text-text-secondary">{t("adminIntakes.multipleAssignments")}</p>
          <button type="button" disabled={busyId === intake.id} onClick={() => onAssign(intake)} className="mt-4 rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">{busyId === intake.id ? t("adminIntakes.working") : t("adminIntakes.assign")}</button>
        </div>}
      </article>)}
    </div>
  );
}

function answerText(t, answer, details) {
  const label = t(`patientWorkspace.answers.${answer}`);
  return answer === "YES" && details ? `${label} — ${details}` : label;
}

function ReadOnlyField({ label, value }) {
  return <div className="rounded-xl border border-border bg-background p-4"><p className="text-xs font-semibold text-text-secondary">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{value || "—"}</p></div>;
}

export default PatientIntakeQueue;
