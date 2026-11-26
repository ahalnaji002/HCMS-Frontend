import { Button, Card, DescriptionList, EmptyState, TextareaField } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";

function PatientDiagnosesSection({ t, diagnoses, value, onChange, isSaving, onSubmit }) {
  const { dateTime } = useFormatDate();
  return (
    <Card id="doctor-diagnoses" title={t("doctorWorkspace.diagnosesTitle")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <TextareaField
          label={t("doctorWorkspace.diagnosisLabel")}
          required
          rows={4}
          maxLength={10000}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button type="submit" disabled={!value.trim()} loading={isSaving} loadingText={t("doctorWorkspace.saving")}>
          {t("doctorWorkspace.saveDiagnosis")}
        </Button>
      </form>
      <div className="mt-6">
        {diagnoses.length ? (
          <DescriptionList
            items={diagnoses.map((diagnosis) => ({
              key: diagnosis.id,
              label: [diagnosis.doctor_name, diagnosis.specialization, dateTime(diagnosis.documented_at)].filter(Boolean).join(" · "),
              value: diagnosis.diagnosis,
            }))}
          />
        ) : <EmptyState title={t("doctorWorkspace.noDiagnoses")} />}
      </div>
    </Card>
  );
}

export default PatientDiagnosesSection;
