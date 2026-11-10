import { Navigate, Route, Routes } from "react-router-dom";
import RoleDashboard from "@/presentation/features/role-dashboard/RoleDashboard";
import PatientCareSummary from "@/presentation/features/patient-workspace/components/PatientCareSummary";
import PatientEmergencyAlertsSection from "@/presentation/features/patient-workspace/components/PatientEmergencyAlertsSection";
import PatientEmergencyDialog, { PatientEmergencyButton } from "@/presentation/features/patient-workspace/components/PatientEmergencyDialog";
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
    isAlertSubmitting, isAlertDialogOpen, openAlertDialog, closeAlertDialog, correctionRequests, correctionMessage, setCorrectionMessage,
    correctionNotice, correctionError, isCorrectionSubmitting, canEdit, statusLabel,
    updateField, handleSubmit, handleAlertSubmit, handleCorrectionSubmit,
    retryProfile, retryAlerts, retryAssignments, retryDiagnoses, retryMedicalRecord,
    updateProfileField, cancelProfileEdit, handleProfileSubmit, setProfileEditing,
  } = usePatientWorkspace();

  const pages = {
    overview: (
      <>
        <div className="mb-8">
          <p className="text-sm font-semibold text-primary">{t("patientWorkspace.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-bold">{t("patientWorkspace.title")}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-text-secondary">{t("patientWorkspace.intro")}</p>
        </div>
        <RoleDashboard role="PATIENT" />
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
      </>
    ),
    healthInformation: (
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
    ),
    medicalRecord: (
      <PatientMedicalRecordSection
        t={t}
        record={medicalRecord}
        loading={medicalRecordLoading}
        absent={medicalRecordAbsent}
        error={medicalRecordError}
        onRetry={retryMedicalRecord}
      />
    ),
    profile: (
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
    ),
    emergencyAlerts: (
      <PatientEmergencyAlertsSection
        t={t}
        alerts={alerts}
        alertsLoading={alertsLoading}
        alertsError={alertsError}
        onRetryAlerts={retryAlerts}
        onOpenDialog={openAlertDialog}
      />
    ),
  };

  // Workspace data is loaded once here and shared by every patient page.
  return (
    <>
      <Routes>
        <Route index element={pages.overview} />
        <Route path="health-information" element={pages.healthInformation} />
        <Route path="medical-record" element={pages.medicalRecord} />
        <Route path="treatment-plans" element={<PatientTreatmentPlansSection />} />
        <Route path="medications-appointments" element={<PatientTreatmentResourcesSection />} />
        <Route path="profile" element={pages.profile} />
        <Route path="emergency-alerts" element={pages.emergencyAlerts} />
        <Route path="*" element={<Navigate to="/patient" replace />} />
      </Routes>
      {/* Keeps the last section clear of the floating emergency button. */}
      <div aria-hidden="true" className="h-20" />
      <PatientEmergencyButton t={t} onClick={openAlertDialog} />
      <PatientEmergencyDialog
        t={t}
        open={isAlertDialogOpen}
        onClose={closeAlertDialog}
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
