import RoleDashboard from "@/presentation/features/role-dashboard/RoleDashboard";
import PatientCareSummary from "@/presentation/features/patient-workspace/components/PatientCareSummary";
import PatientEmergencyAlertsSection from "@/presentation/features/patient-workspace/components/PatientEmergencyAlertsSection";
import PatientIntakeSection from "@/presentation/features/patient-workspace/components/PatientIntakeSection";
import usePatientWorkspace from "@/presentation/features/patient-workspace/usePatientWorkspace";

function PatientWorkspaceFeature() {
  const {
    t, intake, form, isLoading, isSaving, error, notice, profile, alerts,
    assignments, diagnoses, alertForm, setAlertForm, alertNotice, alertError,
    isAlertSubmitting, correctionRequests, correctionMessage, setCorrectionMessage,
    correctionNotice, correctionError, isCorrectionSubmitting, canEdit, statusLabel,
    updateField, handleSubmit, handleAlertSubmit, handleCorrectionSubmit,
  } = usePatientWorkspace();

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold text-primary">{t("patientWorkspace.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-bold">{t("patientWorkspace.title")}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-text-secondary">{t("patientWorkspace.intro")}</p>
      </div>

      <RoleDashboard role="PATIENT" />
      <PatientIntakeSection
        t={t}
        intake={intake}
        form={form}
        isLoading={isLoading}
        isSaving={isSaving}
        error={error}
        notice={notice}
        canEdit={canEdit}
        statusLabel={statusLabel}
        correctionError={correctionError}
        correctionNotice={correctionNotice}
        correctionRequests={correctionRequests}
        correctionMessage={correctionMessage}
        isCorrectionSubmitting={isCorrectionSubmitting}
        onFieldChange={updateField}
        onSubmit={handleSubmit}
        onCorrectionChange={setCorrectionMessage}
        onCorrectionSubmit={handleCorrectionSubmit}
      />
      <PatientCareSummary t={t} assignments={assignments} diagnoses={diagnoses} intake={intake} profile={profile} />
      <PatientEmergencyAlertsSection
        t={t}
        alerts={alerts}
        form={alertForm}
        setForm={setAlertForm}
        error={alertError}
        notice={alertNotice}
        isSubmitting={isAlertSubmitting}
        onSubmit={handleAlertSubmit}
      />
    </>
  );
}

export default PatientWorkspaceFeature;
