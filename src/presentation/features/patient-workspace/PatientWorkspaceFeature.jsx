import RoleDashboard from "@/presentation/features/role-dashboard/RoleDashboard";
import PatientCareSummary from "@/presentation/features/patient-workspace/components/PatientCareSummary";
import PatientEmergencyAlertsSection from "@/presentation/features/patient-workspace/components/PatientEmergencyAlertsSection";
import PatientIntakeSection from "@/presentation/features/patient-workspace/components/PatientIntakeSection";
import PatientMedicalRecordSection from "@/presentation/features/patient-workspace/components/PatientMedicalRecordSection";
import PatientProfileSection from "@/presentation/features/patient-workspace/components/PatientProfileSection";
import PatientTreatmentPlansSection from "@/presentation/features/patient-workspace/components/PatientTreatmentPlansSection";
import PatientTreatmentResourcesSection from "@/presentation/features/patient-workspace/components/PatientTreatmentResourcesSection";
import usePatientWorkspace from "@/presentation/features/patient-workspace/usePatientWorkspace";

function PatientWorkspaceFeature() {
  const {
    t, intake, form, isLoading, isSaving, error, notice,
    profile, profileLoading, profileError, profileNotice, profileForm, profileFieldErrors,
    profileEditing, profileSaving, alerts, alertsLoading, alertsError,
    medicalRecord, medicalRecordLoading, medicalRecordAbsent, medicalRecordError,
    assignmentsLoading, assignmentsError, diagnosesLoading, diagnosesError,
    assignments, diagnoses, alertForm, setAlertForm, alertNotice, alertError,
    isAlertSubmitting, correctionRequests, correctionMessage, setCorrectionMessage,
    correctionNotice, correctionError, isCorrectionSubmitting, canEdit, statusLabel,
    updateField, handleSubmit, handleAlertSubmit, handleCorrectionSubmit,
    retryProfile, retryAlerts, retryAssignments, retryDiagnoses, retryMedicalRecord,
    updateProfileField, cancelProfileEdit, handleProfileSubmit, setProfileEditing,
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
      <PatientCareSummary
        t={t}
        assignments={assignments}
        assignmentsLoading={assignmentsLoading}
        assignmentsError={assignmentsError}
        onRetryAssignments={retryAssignments}
        diagnoses={diagnoses}
        diagnosesLoading={diagnosesLoading}
        diagnosesError={diagnosesError}
        onRetryDiagnoses={retryDiagnoses}
        intake={intake}
      />
      <PatientMedicalRecordSection
        t={t}
        record={medicalRecord}
        loading={medicalRecordLoading}
        absent={medicalRecordAbsent}
        error={medicalRecordError}
        onRetry={retryMedicalRecord}
      />
      <PatientTreatmentPlansSection />
      <PatientTreatmentResourcesSection />
      <PatientProfileSection
        t={t}
        profile={profile}
        loading={profileLoading}
        error={profileError}
        notice={profileNotice}
        form={profileForm}
        fieldErrors={profileFieldErrors}
        editing={profileEditing}
        saving={profileSaving}
        onRetry={retryProfile}
        onEdit={() => setProfileEditing(true)}
        onCancel={cancelProfileEdit}
        onFieldChange={updateProfileField}
        onSubmit={handleProfileSubmit}
      />
      <PatientEmergencyAlertsSection
        t={t}
        alerts={alerts}
        alertsLoading={alertsLoading}
        alertsError={alertsError}
        onRetryAlerts={retryAlerts}
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
