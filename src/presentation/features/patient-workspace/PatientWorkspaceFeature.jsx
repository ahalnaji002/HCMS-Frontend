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
import PatientAssistanceRequestsFeature from "@/presentation/features/patient-workspace/PatientAssistanceRequestsFeature";
import MessagingFeature from "@/presentation/features/messaging/MessagingFeature";
import NotificationsFeature from "@/presentation/features/notifications/NotificationsFeature";
import PatientRemindersFeature from "@/presentation/features/reminders/PatientRemindersFeature";
import usePatientWorkspace from "@/presentation/features/patient-workspace/usePatientWorkspace";

function PatientWorkspaceFeature() {
  const {
    t, intake, form, isLoading, isSaving, error,
    profile, profileLoading, profileError, profileForm, profileFieldErrors,
    profileEditing, profileSaving, alerts, alertsLoading, alertsError,
    cancellingAlertId,
    medicalRecord, medicalRecordLoading, medicalRecordAbsent, medicalRecordError,
    assignmentsLoading, assignmentsError, diagnosesLoading, diagnosesError,
    assignments, diagnoses, alertForm, setAlertForm, alertNotice, alertError,
    isAlertSubmitting, isAlertDialogOpen, openAlertDialog, closeAlertDialog, correctionRequests, correctionMessage, setCorrectionMessage,
    isCorrectionSubmitting, canEdit,
    updateField, handleSubmit, handleAlertSubmit, handleCancelPatientAlert, handleCorrectionSubmit,
    retryProfile, retryAlerts, retryAssignments, retryDiagnoses, retryMedicalRecord,
    updateProfileField, cancelProfileEdit, handleProfileSubmit, setProfileEditing,
  } = usePatientWorkspace();

  const openAlerts = alerts.filter((alert) => !["RESOLVED", "CANCELLED"].includes(alert.status));
  const intakeItem = isLoading ? [] : !intake
    ? [{ id: "intake", tone: "warning", title: t("attention.patient.intakeMissing"), description: t("attention.patient.intakeMissingHint"), href: "/patient/health-information", actionLabel: t("attention.patient.intakeAction") }]
    : intake.status === "DOCTOR_ASSIGNED"
      ? [{ id: "intake", count: 0, title: t("attention.patient.careAssigned") }]
      : [{ id: "intake", tone: "info", title: t(`attention.patient.intake${intake.status}`), href: "/patient/health-information", actionLabel: t("attention.patient.viewAction") }];
  const patientAttention = (dashboard) => [
    ...(alertsLoading ? [] : [{
      id: "emergency",
      tone: "danger",
      count: openAlerts.length,
      title: openAlerts.length ? t("attention.patient.openAlert") : t("attention.patient.noOpenAlert"),
      description: openAlerts.length ? t(`patientWorkspace.alertStatuses.${openAlerts[0].status}`, { defaultValue: openAlerts[0].status }) : undefined,
      href: "/patient/emergency-alerts",
      actionLabel: t("attention.patient.viewAction"),
    }]),
    ...intakeItem,
    ...(dashboard ? [{ id: "plans", tone: "info", count: dashboard.active_treatment_plans, title: t("attention.patient.activePlans"), href: "/patient/treatment-plans", actionLabel: t("attention.patient.viewAction") }] : []),
  ];

  const pages = {
    overview: (
      <>
        <RoleDashboard role="PATIENT" attention={patientAttention} eyebrow={t("patientWorkspace.eyebrow")} />
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
        canEdit={canEdit}
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
        cancellingAlertId={cancellingAlertId}
        onCancelAlert={handleCancelPatientAlert}
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
        <Route path="assistance-requests" element={<PatientAssistanceRequestsFeature />} />
        <Route path="messages" element={<MessagingFeature role="PATIENT" />} />
        <Route path="notifications" element={<NotificationsFeature role="PATIENT" />} />
        <Route path="reminders" element={<PatientRemindersFeature />} />
        <Route path="*" element={<Navigate to="/patient" replace />} />
      </Routes>
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
