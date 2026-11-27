import { Button, Card, DescriptionList, EmptyState, LoadingState, SelectField, StatusBadge, TextField } from "@/presentation/components/ui";
import { useSpecializationLabel } from "@/presentation/hooks/useSpecializationLabel";

function answerText(t, answer, details) {
  const label = t(`patientWorkspace.answers.${answer}`);
  return answer === "YES" && details ? `${label} — ${details}` : label;
}

function PatientIntakeQueue({
  t, loading, intakes, doctors, reasons, selectedDoctors, busyId,
  onReasonChange, onDoctorChange, onStartReview, onAssign,
}) {
  const specializationLabel = useSpecializationLabel();
  if (loading) return <div id="admin-intakes"><LoadingState label={t("adminIntakes.loading")} /></div>;
  if (intakes.length === 0) return <div id="admin-intakes"><EmptyState title={t("adminIntakes.empty")} /></div>;

  const doctorOptions = doctors.map((doctor) => ({
    value: String(doctor.id),
    disabled: doctor.availability === "UNAVAILABLE",
    label: `${doctor.full_name} — ${specializationLabel(doctor.specialization)} (${t(`adminIntakes.availabilityValues.${doctor.availability}`)}; ${doctor.active_assignment_count}/${doctor.capacity_limit ?? "∞"})`,
  }));

  return (
    <div id="admin-intakes" className="space-y-6">
      {intakes.map((intake) => {
        const busy = busyId === intake.id;
        return (
          <Card
            key={intake.id}
            as="article"
            title={intake.patient_name}
            description={intake.patient_email}
            actions={<StatusBadge status={intake.status} labelPrefix="patientWorkspace.status" />}
          >
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

            {intake.status === "SUBMITTED" && (
              <Button className="mt-6" loading={busy} loadingText={t("adminIntakes.working")} disabled={busyId !== null} onClick={() => onStartReview(intake.id)}>
                {t("adminIntakes.startReview")}
              </Button>
            )}

            {["UNDER_REVIEW", "DOCTOR_ASSIGNED"].includes(intake.status) && (
              <div className="mt-6 border-t border-border pt-6">
                <h3 className="font-bold">{t("adminIntakes.assignTitle")}</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <SelectField
                    label={t("adminIntakes.doctor")}
                    placeholder={t("adminIntakes.selectDoctor")}
                    options={doctorOptions}
                    value={selectedDoctors[intake.id] || ""}
                    onChange={(event) => onDoctorChange(intake.id, event.target.value)}
                  />
                  <TextField
                    label={t("adminIntakes.reason")}
                    maxLength={255}
                    value={reasons[intake.id] || ""}
                    onChange={(event) => onReasonChange(intake.id, event.target.value)}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-text-secondary">{t("adminIntakes.multipleAssignments")}</p>
                <Button className="mt-4" loading={busy} loadingText={t("adminIntakes.working")} disabled={busyId !== null} onClick={() => onAssign(intake)}>
                  {t("adminIntakes.assign")}
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export default PatientIntakeQueue;
