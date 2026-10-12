import MedicalInfoField from "@/presentation/features/doctor-workspace/components/MedicalInfoField";

function PatientIntakeSummary({ t, patient, intake }) {
  return (
    <section id="doctor-medical-record" className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="text-xl font-bold">{patient.full_name}</h2>
      <p className="mt-1 text-sm text-text-secondary">{patient.email}</p>
      <h3 className="mt-6 font-bold">{t("doctorWorkspace.patientReport")}</h3>
      {intake ? <div className="mt-4 grid gap-4 md:grid-cols-2">
        <MedicalInfoField label={t("patientWorkspace.currentProblem")} value={intake.current_problem} />
        <MedicalInfoField label={t("patientWorkspace.symptoms")} value={intake.symptoms} />
        <MedicalInfoField label={t("patientWorkspace.onset")} value={intake.symptom_onset} />
        <MedicalInfoField label={t("patientWorkspace.chronicConditions")} value={answerText(t, intake.chronic_conditions_answer, intake.chronic_conditions_details)} />
        <MedicalInfoField label={t("patientWorkspace.medications")} value={answerText(t, intake.medications_answer, intake.medications_details)} />
        <MedicalInfoField label={t("patientWorkspace.allergies")} value={answerText(t, intake.allergies_answer, intake.allergies_details)} />
        {intake.additional_information && <MedicalInfoField label={t("patientWorkspace.additionalInformation")} value={intake.additional_information} />}
      </div> : <p className="mt-3 text-sm text-text-secondary">{t("doctorWorkspace.noIntake")}</p>}
    </section>
  );
}

function answerText(t, answer, details) {
  const label = t(`patientWorkspace.answers.${answer}`);
  return answer === "YES" && details ? `${label} — ${details}` : label;
}

export default PatientIntakeSummary;
