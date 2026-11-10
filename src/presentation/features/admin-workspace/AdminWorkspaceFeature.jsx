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

  const count = (list, predicate) => list.filter(predicate).length;
  const adminAttention = (dashboard) => (loading ? [] : [
    { id: "emergencies", tone: "danger", count: count(emergencyAlerts, (alert) => alert.status === "PENDING_ASSIGNMENT"), title: t("attention.admin.emergencies"), description: t("attention.admin.emergenciesHint"), href: "/admin/emergency-alerts", actionLabel: t("attention.admin.emergenciesAction") },
    { id: "newIntakes", tone: "warning", count: count(intakes, (intake) => intake.status === "SUBMITTED"), title: t("attention.admin.newIntakes"), description: t("attention.admin.newIntakesHint"), href: "/admin/patient-intakes", actionLabel: t("attention.admin.reviewAction") },
    { id: "awaitingDoctor", tone: "warning", count: count(intakes, (intake) => intake.status === "UNDER_REVIEW"), title: t("attention.admin.awaitingDoctor"), description: t("attention.admin.awaitingDoctorHint"), href: "/admin/patient-intakes", actionLabel: t("attention.admin.assignAction") },
    ...(dashboard ? [{ id: "joinRequests", tone: "info", count: dashboard.pending_join_requests, title: t("attention.admin.joinRequests"), description: t("attention.admin.joinRequestsHint"), href: "/admin/join-requests", actionLabel: t("attention.admin.reviewAction") }] : []),
    { id: "corrections", tone: "info", count: count(correctionRequests, (request) => request.status === "OPEN"), title: t("attention.admin.corrections"), description: t("attention.admin.correctionsHint"), href: "/admin/support", actionLabel: t("attention.admin.respondAction") },
    { id: "doctors", tone: "info", count: count(doctors, (doctor) => doctor.availability === "UNAVAILABLE" || doctor.capacity_warning), title: t("attention.admin.doctors"), description: t("attention.admin.doctorsHint"), href: "/admin/doctor-workload", actionLabel: t("attention.admin.viewAction") },
  ]);

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
                <p className="text-sm font-semibold text-primary">{t("attention.admin.overviewEyebrow")}</p>
                <h1 className="mt-2 text-3xl font-bold">{t("attention.admin.overviewTitle")}</h1>
                <p className="mt-3 max-w-3xl leading-7 text-text-secondary">{t("attention.admin.overviewDescription")}</p>
              </div>
              <RoleDashboard role="ADMIN" attention={adminAttention} />
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
