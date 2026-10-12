import RoleDashboard from "@/presentation/features/role-dashboard/RoleDashboard";
import AssignedPatientsList from "@/presentation/features/doctor-workspace/components/AssignedPatientsList";
import PatientDiagnosesSection from "@/presentation/features/doctor-workspace/components/PatientDiagnosesSection";
import PatientIntakeSummary from "@/presentation/features/doctor-workspace/components/PatientIntakeSummary";
import PatientMedicalNotesSection from "@/presentation/features/doctor-workspace/components/PatientMedicalNotesSection";
import useDoctorWorkspace from "@/presentation/features/doctor-workspace/useDoctorWorkspace";

function DoctorWorkspaceFeature() {
  const {
    t, patients, selectedPatientId, setSelectedPatientId, intake, notes, diagnoses,
    diagnosisText, setDiagnosisText, noteForm, setNoteForm, loading, detailLoading,
    setDetailLoading, saving, error, setError, notice, currentPatient,
    handleNoteSubmit, handleDiagnosisSubmit,
  } = useDoctorWorkspace();

  return (
    <>
      <p className="text-sm font-semibold text-primary">{t("doctorWorkspace.eyebrow")}</p>
      <h1 id="doctor-patients" className="mt-2 text-3xl font-bold">{t("doctorWorkspace.title")}</h1>
      <RoleDashboard role="DOCTOR" />
      {error && <p role="alert" className="mt-6 rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="mt-6 rounded-xl bg-primary/10 p-4 text-sm text-primary">{notice}</p>}
      {loading ? <p className="py-12 text-center text-text-secondary">{t("doctorWorkspace.loading")}</p> : patients.length === 0 ? (
        <p className="mt-8 rounded-xl border border-border bg-surface p-6 text-text-secondary">{t("doctorWorkspace.empty")}</p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <AssignedPatientsList
            t={t}
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelect={setSelectedPatientId}
            onClearError={() => setError("")}
            onStartLoading={() => setDetailLoading(true)}
          />
          <div className="space-y-6">
            {detailLoading ? <p className="py-12 text-center text-text-secondary">{t("doctorWorkspace.loadingDetails")}</p> : currentPatient && <>
              <PatientIntakeSummary t={t} patient={currentPatient} intake={intake} />
              <PatientDiagnosesSection
                t={t}
                diagnoses={diagnoses}
                value={diagnosisText}
                onChange={setDiagnosisText}
                isSaving={saving}
                onSubmit={handleDiagnosisSubmit}
              />
              <PatientMedicalNotesSection
                t={t}
                notes={notes}
                value={noteForm.note}
                onChange={(note) => setNoteForm({ note })}
                isSaving={saving}
                onSubmit={handleNoteSubmit}
              />
            </>}
          </div>
        </div>
      )}
    </>
  );
}

export default DoctorWorkspaceFeature;
