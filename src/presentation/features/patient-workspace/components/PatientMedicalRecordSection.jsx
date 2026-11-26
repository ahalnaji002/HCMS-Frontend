import { Button, Card, DescriptionList, EmptyState, ErrorState, LoadingState, PageHeader } from "@/presentation/components/ui";

const FIELDS = ["blood_type", "allergies", "chronic_diseases", "medical_history", "previous_surgeries"];

function PatientMedicalRecordSection({ t, record, loading, absent, error, onRetry }) {
  return (
    <div id="patient-medical-record">
      <PageHeader
        title={t("patientWorkspace.medicalRecord.title")}
        description={t("patientWorkspace.medicalRecord.description")}
        actions={record && !loading && !error && <Button variant="secondary" onClick={onRetry}>{t("patientWorkspace.medicalRecord.refresh")}</Button>}
      />
      {loading ? <LoadingState label={t("patientWorkspace.medicalRecord.loading")} />
        : error ? <ErrorState message={error} onRetry={onRetry} retryLabel={t("patientWorkspace.retry")} />
          : absent ? (
            <EmptyState
              title={t("patientWorkspace.medicalRecord.absent")}
              action={<Button variant="secondary" size="sm" onClick={onRetry}>{t("patientWorkspace.medicalRecord.reload")}</Button>}
            />
          ) : record && (
            <Card>
              <DescriptionList
                columns={2}
                emptyText={t("patientWorkspace.medicalRecord.notProvided")}
                items={FIELDS.map((field) => ({ key: field, label: t(`patientWorkspace.medicalRecord.fields.${field}`), value: record[field] }))}
              />
            </Card>
          )}
    </div>
  );
}

export default PatientMedicalRecordSection;
