import { Card, DescriptionList, EmptyState } from "@/presentation/components/ui";

function answerText(t, answer, details) {
  const label = t(`patientWorkspace.answers.${answer}`);
  return answer === "YES" && details ? `${label} — ${details}` : label;
}

// The patient's own health report (not a diagnosis), first tab of the file.
function PatientIntakeSummary({ t, intake }) {
  return (
    <Card id="doctor-intake-summary" title={t("doctorWorkspace.patientReport")}>
      {intake ? (
        <DescriptionList
          columns={2}
          items={[
            { label: t("patientWorkspace.currentProblem"), value: intake.current_problem },
            { label: t("patientWorkspace.symptoms"), value: intake.symptoms },
            { label: t("patientWorkspace.onset"), value: intake.symptom_onset },
            { label: t("patientWorkspace.chronicConditions"), value: answerText(t, intake.chronic_conditions_answer, intake.chronic_conditions_details) },
            { label: t("patientWorkspace.medications"), value: answerText(t, intake.medications_answer, intake.medications_details) },
            { label: t("patientWorkspace.allergies"), value: answerText(t, intake.allergies_answer, intake.allergies_details) },
            { label: t("patientWorkspace.additionalInformation"), value: intake.additional_information, wide: true },
          ]}
        />
      ) : <EmptyState title={t("doctorWorkspace.noIntake")} />}
    </Card>
  );
}

export default PatientIntakeSummary;
