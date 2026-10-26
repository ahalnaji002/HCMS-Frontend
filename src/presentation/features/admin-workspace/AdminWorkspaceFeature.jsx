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
    workloadDrafts, setWorkloadDrafts, loading, busyId, error, notice,
    correctionRequests, correctionResponses, setCorrectionResponses, emergencyAlerts,
    emergencyDoctors, setEmergencyDoctors, handleStartReview, handleAssign,
    handleEmergencyAssign, handleSaveWorkload, handleResolveCorrection,
  } = useAdminWorkspace();

  return (
    <>
      <p className="text-sm font-semibold text-primary">{t("adminIntakes.eyebrow")}</p>
      <h1 className="mt-2 text-3xl font-bold">{t("adminIntakes.title")}</h1>
      <p className="mt-3 max-w-3xl leading-7 text-text-secondary">{t("adminIntakes.description")}</p>
      <RoleDashboard role="ADMIN" />
      {error && <p role="alert" className="mt-6 rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="mt-6 rounded-xl bg-primary/10 p-4 text-sm text-primary">{notice}</p>}

      <JoinRequestsSection />
      <DoctorPatientAssignmentsSection />
      <EmergencyAlertsSection
        t={t}
        alerts={emergencyAlerts}
        doctors={doctors}
        selectedDoctorIds={emergencyDoctors}
        onDoctorChange={(id, doctorId) => setEmergencyDoctors((current) => ({ ...current, [id]: doctorId }))}
        busyId={busyId}
        onAssign={handleEmergencyAssign}
      />
      <CorrectionRequestsSection
        t={t}
        requests={correctionRequests}
        responses={correctionResponses}
        onResponseChange={(id, response) => setCorrectionResponses((current) => ({ ...current, [id]: response }))}
        busyId={busyId}
        onResolve={handleResolveCorrection}
      />
      <DoctorWorkloadSection
        t={t}
        doctors={doctors}
        drafts={workloadDrafts}
        onDraftChange={(id, draft) => setWorkloadDrafts((current) => ({ ...current, [id]: draft }))}
        busyId={busyId}
        onSave={handleSaveWorkload}
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
  );
}

export default AdminWorkspaceFeature;
