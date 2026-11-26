import { Navigate, Route, Routes } from "react-router-dom";
import { Card, EmptyState, ErrorState, LoadingState, PageHeader, Tabs } from "@/presentation/components/ui";
import RoleDashboard from "@/presentation/features/role-dashboard/RoleDashboard";
import AssignedPatientsList from "@/presentation/features/doctor-workspace/components/AssignedPatientsList";
import PatientDiagnosesSection from "@/presentation/features/doctor-workspace/components/PatientDiagnosesSection";
import PatientIntakeSummary from "@/presentation/features/doctor-workspace/components/PatientIntakeSummary";
import PatientMedicalNotesSection from "@/presentation/features/doctor-workspace/components/PatientMedicalNotesSection";
import PatientMedicalRecordSection from "@/presentation/features/doctor-workspace/components/PatientMedicalRecordSection";
import DoctorAssistanceRequestSection from "@/presentation/features/doctor-workspace/components/DoctorAssistanceRequestSection";
import DoctorEmergencyAlertsPage from "@/presentation/features/doctor-workspace/components/DoctorEmergencyAlertsPage";
import DoctorTreatmentPlansSection from "@/presentation/features/doctor-workspace/components/DoctorTreatmentPlansSection";
import MessagingFeature from "@/presentation/features/messaging/MessagingFeature";
import NotificationsFeature from "@/presentation/features/notifications/NotificationsFeature";
import useDoctorWorkspace from "@/presentation/features/doctor-workspace/useDoctorWorkspace";

function DoctorWorkspaceFeature() {
  const {
    t, patients, selectedPatientId, selectPatient, intake, notes, diagnoses, medicalRecord,
    diagnosisText, setDiagnosisText, noteForm, setNoteForm, loading, detailLoading,
    saving, loadError, currentPatient,
    handleNoteSubmit, handleDiagnosisSubmit, saveMedicalRecord, handleAssistanceAccessLoss,
  } = useDoctorWorkspace();

  const doctorAttention = (dashboard) => [
    ...(dashboard ? [{ id: "emergencies", tone: "danger", count: dashboard.assigned_emergency_alerts, title: t("attention.doctor.emergencies"), description: t("attention.doctor.emergenciesHint"), href: "/doctor/emergency-alerts", actionLabel: t("roleDashboard.actions.emergencyAlerts") }] : []),
    ...patients.slice(0, 4).map((patient) => ({
      id: `patient-${patient.id}`,
      tone: "info",
      title: patient.full_name,
      description: t("attention.doctor.patientHint"),
      href: "/doctor/patients",
      onAction: () => selectPatient(String(patient.id)),
      actionLabel: t("attention.doctor.openFile"),
    })),
  ];

  const overview = (
    <>
      <RoleDashboard role="DOCTOR" attention={doctorAttention} eyebrow={t("doctorWorkspace.eyebrow")} />
    </>
  );

  // The patient file: one tab per kind of work instead of a three-screen page
  // (UX-13). Panels stay mounted so a half-typed form survives a tab switch;
  // the tabs reset to the summary when another patient is opened.
  const patientFile = currentPatient && (
    <Card title={currentPatient.full_name} description={currentPatient.email} padding="sm">
      <Tabs
        key={selectedPatientId}
        keepMounted
        label={t("doctorWorkspace.tabs.label")}
        tabs={[
          { id: "summary", label: t("doctorWorkspace.tabs.summary"), content: <PatientIntakeSummary t={t} intake={intake} /> },
          {
            id: "record",
            label: t("doctorWorkspace.tabs.record"),
            content: <PatientMedicalRecordSection key={`${selectedPatientId}-${medicalRecord?.id || "new"}`} t={t} record={medicalRecord} isSaving={saving} onSave={saveMedicalRecord} />,
          },
          {
            id: "diagnoses",
            label: t("doctorWorkspace.tabs.diagnoses"),
            count: diagnoses.length || undefined,
            content: <PatientDiagnosesSection t={t} diagnoses={diagnoses} value={diagnosisText} onChange={setDiagnosisText} isSaving={saving} onSubmit={handleDiagnosisSubmit} />,
          },
          {
            id: "notes",
            label: t("doctorWorkspace.tabs.notes"),
            count: notes.length || undefined,
            content: <PatientMedicalNotesSection t={t} notes={notes} value={noteForm.note} onChange={(note) => setNoteForm({ note })} isSaving={saving} onSubmit={handleNoteSubmit} />,
          },
          { id: "plans", label: t("doctorWorkspace.tabs.plans"), content: <DoctorTreatmentPlansSection key={`plans-${selectedPatientId}`} patientId={selectedPatientId} /> },
          {
            id: "assistance",
            label: t("doctorWorkspace.tabs.assistance"),
            content: <DoctorAssistanceRequestSection key={`assistance-${selectedPatientId}`} patient={currentPatient} onAccessDenied={handleAssistanceAccessLoss} />,
          },
        ]}
      />
    </Card>
  );

  const patientsPage = (
    <>
      <PageHeader id="doctor-patients" title={t("roleNavigation.doctor.patients")} />
      {loading ? <LoadingState label={t("doctorWorkspace.loading")} />
        : loadError ? <ErrorState message={t(loadError)} />
          : patients.length === 0 ? <EmptyState title={t("doctorWorkspace.empty")} />
            : (
              <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <AssignedPatientsList t={t} patients={patients} selectedPatientId={selectedPatientId} onSelect={selectPatient} />
                <div className="min-w-0">
                  {detailLoading ? <LoadingState label={t("doctorWorkspace.loadingDetails")} /> : patientFile}
                </div>
              </div>
            )}
    </>
  );

  // Patient data is loaded once here and shared by the doctor pages.
  return (
    <Routes>
      <Route index element={overview} />
      <Route path="patients" element={patientsPage} />
      <Route path="emergency-alerts" element={<DoctorEmergencyAlertsPage />} />
      <Route path="messages" element={<MessagingFeature role="DOCTOR" />} />
      <Route path="notifications" element={<NotificationsFeature role="DOCTOR" />} />
      <Route path="*" element={<Navigate to="/doctor" replace />} />
    </Routes>
  );
}

export default DoctorWorkspaceFeature;
