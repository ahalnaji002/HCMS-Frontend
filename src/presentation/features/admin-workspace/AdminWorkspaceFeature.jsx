import { Navigate, Route, Routes } from "react-router-dom";
import { Button, PageHeader } from "@/presentation/components/ui";
import RoleDashboard from "@/presentation/features/role-dashboard/RoleDashboard";
import CorrectionRequestsSection from "@/presentation/features/admin-workspace/components/CorrectionRequestsSection";
import DoctorWorkloadSection from "@/presentation/features/admin-workspace/components/DoctorWorkloadSection";
import EmergencyAlertsSection from "@/presentation/features/admin-workspace/components/EmergencyAlertsSection";
import JoinRequestsSection from "@/presentation/features/admin-workspace/components/JoinRequestsSection";
import DoctorPatientAssignmentsSection from "@/presentation/features/admin-workspace/components/DoctorPatientAssignmentsSection";
import PatientIntakeQueue from "@/presentation/features/admin-workspace/components/PatientIntakeQueue";
import NotificationsFeature from "@/presentation/features/notifications/NotificationsFeature";
import SystemSettingsFeature from "@/presentation/features/admin-workspace/components/SystemSettingsFeature";
import { AdminOrganizationsPage, AdminUsersPage } from "@/presentation/features/admin-workspace/components/UserManagementFeature";
import AdminReportsFeature from "@/presentation/features/admin-workspace/components/AdminReportsFeature";
import useAdminWorkspace from "@/presentation/features/admin-workspace/useAdminWorkspace";

function AdminWorkspaceFeature() {
  const {
    t, intakes, doctors, reasons, setReasons, selectedDoctors, setSelectedDoctors,
    workloadDrafts, setWorkloadDrafts, loading, busyId,
    correctionRequests, correctionResponses, setCorrectionResponses, emergencyAlerts,
    emergencyDoctors, setEmergencyDoctors, emergencyLoading, emergencyLoadError,
    handleRefreshEmergencyAlerts, handleStartReview, handleAssign,
    handleEmergencyAssign, handleSaveWorkload, handleResolveCorrection,
  } = useAdminWorkspace();

  const count = (list, predicate) => list.filter(predicate).length;
  const adminAttention = (dashboard) => (loading ? [] : [
    { id: "emergencies", tone: "danger", count: count(emergencyAlerts, (alert) => alert.status === "PENDING_ASSIGNMENT"), title: t("attention.admin.emergencies"), description: t("attention.admin.emergenciesHint"), href: "/admin/emergency-alerts", actionLabel: t("attention.admin.emergenciesAction") },
    { id: "newIntakes", tone: "warning", count: count(intakes, (intake) => intake.status === "SUBMITTED"), title: t("attention.admin.newIntakes"), description: t("attention.admin.newIntakesHint"), href: "/admin/patient-intakes", actionLabel: t("attention.admin.reviewAction") },
    { id: "awaitingDoctor", tone: "warning", count: count(intakes, (intake) => intake.status === "UNDER_REVIEW"), title: t("attention.admin.awaitingDoctor"), description: t("attention.admin.awaitingDoctorHint"), href: "/admin/patient-intakes", actionLabel: t("attention.admin.assignAction") },
    ...(dashboard ? [{ id: "joinRequests", tone: "info", count: dashboard.pending_join_requests, title: t("attention.admin.joinRequests"), description: t("attention.admin.joinRequestsHint"), href: "/admin/join-requests", actionLabel: t("attention.admin.reviewAction") }] : []),
    { id: "corrections", tone: "info", count: count(correctionRequests, (request) => request.status === "OPEN"), title: t("attention.admin.corrections"), description: t("attention.admin.correctionsHint"), href: "/admin/support", actionLabel: t("attention.admin.respondAction") },
    { id: "doctors", tone: "info", count: count(doctors, (doctor) => doctor.availability === "UNAVAILABLE" || doctor.capacity_warning), title: t("attention.admin.doctors"), description: t("attention.admin.doctorsHint"), href: "/admin/doctor-workload", actionLabel: t("attention.admin.viewAction") },
  ]);

  // Workspace data is loaded once here and shared by every administrator page.
  return (
    <>
      <Routes>
        <Route
          index
          element={(
            <>
              <PageHeader eyebrow={t("attention.admin.overviewEyebrow")} title={t("attention.admin.overviewTitle")} description={t("attention.admin.overviewDescription")} />
              <RoleDashboard role="ADMIN" attention={adminAttention} />
            </>
          )}
        />
        <Route
          path="join-requests"
          element={(
            <>
              <PageHeader eyebrow={t("adminJoinRequests.eyebrow")} title={t("roleNavigation.admin.joinRequests")} description={t("adminJoinRequests.description")} />
              <JoinRequestsSection />
            </>
          )}
        />
        <Route
          path="patient-intakes"
          element={(
            <>
            <PageHeader
              eyebrow={t("adminIntakes.eyebrow")}
              title={t("roleNavigation.admin.patientIntakes")}
              description={t("adminIntakes.description")}
            />
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
            </>
          )}
        />
        <Route
          path="assignments"
          element={(
            <>
              <PageHeader eyebrow={t("adminAssignments.eyebrow")} title={t("adminAssignments.title")} description={t("adminAssignments.description")} />
              <DoctorPatientAssignmentsSection />
            </>
          )}
        />
        <Route
          path="doctor-workload"
          element={(
            <>
            <PageHeader title={t("adminIntakes.workloadTitle")} description={t("adminIntakes.workloadDescription")} />
            <DoctorWorkloadSection
              t={t}
              doctors={doctors}
              drafts={workloadDrafts}
              onDraftChange={(id, draft) => setWorkloadDrafts((current) => ({ ...current, [id]: draft }))}
              busyId={busyId}
              onSave={handleSaveWorkload}
            />
            </>
          )}
        />
        <Route
          path="emergency-alerts"
          element={(
            <>
            <PageHeader
              title={t("adminIntakes.emergencyTitle")}
              description={t("adminIntakes.emergencyDescription")}
              actions={<Button variant="secondary" onClick={handleRefreshEmergencyAlerts} disabled={emergencyLoading}>{t("ui.refresh")}</Button>}
            />
            <EmergencyAlertsSection
              t={t}
              alerts={emergencyAlerts}
              doctors={doctors}
              loading={emergencyLoading}
              loadError={emergencyLoadError}
              selectedDoctorIds={emergencyDoctors}
              onRefresh={handleRefreshEmergencyAlerts}
              onDoctorChange={(id, doctorId) => setEmergencyDoctors((current) => ({ ...current, [id]: doctorId }))}
              busyId={busyId}
              onAssign={handleEmergencyAssign}
            />
            </>
          )}
        />
        <Route
          path="support"
          element={(
            <>
            <PageHeader title={t("adminIntakes.correctionsTitle")} description={t("adminIntakes.correctionsDescription")} />
            <CorrectionRequestsSection
              t={t}
              requests={correctionRequests}
              responses={correctionResponses}
              onResponseChange={(id, response) => setCorrectionResponses((current) => ({ ...current, [id]: response }))}
              busyId={busyId}
              onResolve={handleResolveCorrection}
            />
            </>
          )}
        />
        <Route path="notifications" element={<NotificationsFeature role="ADMIN" />} />
        <Route path="settings" element={<SystemSettingsFeature />} />
        <Route path="reports" element={<AdminReportsFeature />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="organizations" element={<AdminOrganizationsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </>
  );
}

export default AdminWorkspaceFeature;
