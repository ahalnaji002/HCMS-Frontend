import { Badge, Card, DescriptionList, EmptyState, ErrorState, LoadingState } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";
import { useSpecializationLabel } from "@/presentation/hooks/useSpecializationLabel";

// Shown on the patient home once a doctor is assigned: the care team and the
// doctors' diagnoses.
function PatientCareSummary({
  t, assignments, assignmentsLoading, assignmentsError, onRetryAssignments,
  diagnoses, diagnosesLoading, diagnosesError, onRetryDiagnoses, intake,
}) {
  const { dateTime } = useFormatDate();
  const specializationLabel = useSpecializationLabel();
  if (intake?.status !== "DOCTOR_ASSIGNED") return null;

  return (
    <div className="space-y-8">
      <Card title={t("patientWorkspace.assignedDoctors")}>
        {assignmentsLoading ? <LoadingState label={t("patientWorkspace.assignmentsLoading")} />
          : assignmentsError ? <ErrorState message={assignmentsError} onRetry={onRetryAssignments} retrying={assignmentsLoading} retryLabel={t("patientWorkspace.retry")} />
            : assignments.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold">{assignment.doctor_name}</p>
                        <p className="mt-1 text-sm text-text-secondary">{specializationLabel(assignment.specialization)}</p>
                      </div>
                      <Badge tone="success">{t("patientWorkspace.active")}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-text-secondary">{t("patientWorkspace.assignmentNextStep")}</p>
                  </div>
                ))}
              </div>
            ) : <EmptyState title={t("patientWorkspace.noAssignments")} />}
      </Card>

      <Card title={t("patientWorkspace.diagnosesTitle")} description={t("patientWorkspace.diagnosesDescription")}>
        {diagnosesLoading ? <LoadingState label={t("patientWorkspace.diagnosesLoading")} />
          : diagnosesError ? <ErrorState message={diagnosesError} onRetry={onRetryDiagnoses} retrying={diagnosesLoading} retryLabel={t("patientWorkspace.retry")} />
            : diagnoses.length ? (
              <DescriptionList
                items={diagnoses.map((diagnosis) => ({
                  key: diagnosis.id,
                  label: [diagnosis.doctor_name, specializationLabel(diagnosis.specialization), dateTime(diagnosis.documented_at)].filter(Boolean).join(" · "),
                  value: diagnosis.diagnosis,
                }))}
              />
            ) : <EmptyState title={t("patientWorkspace.noDiagnoses")} />}
      </Card>
    </div>
  );
}

export default PatientCareSummary;
