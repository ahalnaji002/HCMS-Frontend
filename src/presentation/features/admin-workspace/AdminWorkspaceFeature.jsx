import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import StatusToast from "@/presentation/components/common/StatusToast";
import RoleDashboard from "@/presentation/features/role-dashboard/RoleDashboard";
import CorrectionRequestsSection from "@/presentation/features/admin-workspace/components/CorrectionRequestsSection";
import DoctorWorkloadSection from "@/presentation/features/admin-workspace/components/DoctorWorkloadSection";
import EmergencyAlertsSection from "@/presentation/features/admin-workspace/components/EmergencyAlertsSection";
import JoinRequestsSection from "@/presentation/features/admin-workspace/components/JoinRequestsSection";
import DoctorPatientAssignmentsSection from "@/presentation/features/admin-workspace/components/DoctorPatientAssignmentsSection";
import PatientIntakeQueue from "@/presentation/features/admin-workspace/components/PatientIntakeQueue";
import useAdminWorkspace from "@/presentation/features/admin-workspace/useAdminWorkspace";

function AdminWorkspaceFeature() {
  const {
    t, intakes, doctors, reasons, setReasons, selectedDoctors, setSelectedDoctors,
    workloadDrafts, setWorkloadDrafts, loading, busyId, error, notice, clearMessages,
    correctionRequests, correctionResponses, setCorrectionResponses, emergencyAlerts,
    emergencyDoctors, setEmergencyDoctors, handleStartReview, handleAssign,
    handleEmergencyAssign, handleSaveWorkload, handleResolveCorrection,
  } = useAdminWorkspace();
  const { pathname } = useLocation();

  // A message belongs to the page where the action happened.
  useEffect(() => {
    clearMessages();
  }, [pathname, clearMessages]);

  // Workspace data is loaded once here and shared by every administrator page.
  return (
    <>
      <StatusToast error={error} notice={notice} onDismiss={clearMessages} dismissLabel={t("roleHome.dismissMessage")} />
      <Routes>
        <Route
          index
          element={(
            <>
              <div className="mb-8">
                <p className="text-sm font-semibold text-primary">{t("adminIntakes.eyebrow")}</p>
                <h1 className="mt-2 text-3xl font-bold">{t("adminIntakes.title")}</h1>
                <p className="mt-3 max-w-3xl leading-7 text-text-secondary">{t("adminIntakes.description")}</p>
              </div>
              <RoleDashboard role="ADMIN" />
            </>
          )}
        />
        <Route path="join-requests" element={<JoinRequestsSection />} />
        <Route
          path="patient-intakes"
          element={(
            <PatientIntakeQueue
              t={t}
              loading={loading}
              intakes={intakes}
              doctors={doctors}
              reasons={reasons}
              selectedDoctors={selectedDoctors}
              busyId={busyId}
              onReasonChange={(id, reason) => setReasons((current) => ({ ...current, [id]: reason }))}
              onDoctorChange={(id, doctorId) => setSelectedDoctors((current) => ({ ...current, [id]: doctorId }))}
              onStartReview={handleStartReview}
              onAssign={handleAssign}
            />
          )}
        />
        <Route path="assignments" element={<DoctorPatientAssignmentsSection />} />
        <Route
          path="doctor-workload"
          element={(
            <DoctorWorkloadSection
              t={t}
              doctors={doctors}
              drafts={workloadDrafts}
              onDraftChange={(id, draft) => setWorkloadDrafts((current) => ({ ...current, [id]: draft }))}
              busyId={busyId}
              onSave={handleSaveWorkload}
            />
          )}
        />
        <Route
          path="emergency-alerts"
          element={(
            <EmergencyAlertsSection
              t={t}
              alerts={emergencyAlerts}
              doctors={doctors}
              selectedDoctorIds={emergencyDoctors}
              onDoctorChange={(id, doctorId) => setEmergencyDoctors((current) => ({ ...current, [id]: doctorId }))}
              busyId={busyId}
              onAssign={handleEmergencyAssign}
            />
          )}
        />
        <Route
          path="support"
          element={(
            <CorrectionRequestsSection
              t={t}
              requests={correctionRequests}
              responses={correctionResponses}
              onResponseChange={(id, response) => setCorrectionResponses((current) => ({ ...current, [id]: response }))}
              busyId={busyId}
              onResolve={handleResolveCorrection}
            />
          )}
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </>
  );
}

export default AdminWorkspaceFeature;
