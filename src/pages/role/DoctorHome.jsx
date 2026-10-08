import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/useAuth";
import LanguageToggle from "../../components/common/LanguageToggle";
import {
  createPatientMedicalNote,
  createPatientMedicalRecord,
  getAssignedPatientIntake,
  getPatientMedicalRecord,
  listAssignedPatients,
  listOwnPatientNotes,
  listPatientDiagnoses,
  createPatientDiagnosis,
} from "../../services/doctorWorkspace";

function DoctorHome() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [intake, setIntake] = useState(null);
  const [notes, setNotes] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [diagnosisText, setDiagnosisText] = useState("");
  const [noteForm, setNoteForm] = useState({ note: "" });
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshPatientData = useCallback(async (patientId) => {
    const [intakeResponse, noteResponse, diagnosisResponse] = await Promise.all([
      getAssignedPatientIntake(patientId),
      listOwnPatientNotes(patientId),
      listPatientDiagnoses(patientId),
    ]);
    setIntake(intakeResponse.data.data.intake);
    setNotes(noteResponse.data.data.medical_notes);
    setDiagnoses(diagnosisResponse.data.data.diagnoses);
  }, []);

  useEffect(() => {
    let active = true;
    listAssignedPatients()
      .then(({ data }) => {
        if (!active) return;
        const assignedPatients = data.data.patients;
        setPatients(assignedPatients);
        setSelectedPatientId(assignedPatients[0] ? String(assignedPatients[0].id) : "");
      })
      .catch(() => active && setError(t("doctorWorkspace.loadError")))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [t]);

  useEffect(() => {
    if (!selectedPatientId) {
      return undefined;
    }
    let active = true;
    Promise.all([
      getAssignedPatientIntake(selectedPatientId),
      listOwnPatientNotes(selectedPatientId),
      listPatientDiagnoses(selectedPatientId),
    ])
      .then(([intakeResponse, noteResponse, diagnosisResponse]) => {
        if (!active) return;
        setIntake(intakeResponse.data.data.intake);
        setNotes(noteResponse.data.data.medical_notes);
        setDiagnoses(diagnosisResponse.data.data.diagnoses);
      })
      .catch(() => active && setError(t("doctorWorkspace.detailError")))
      .finally(() => active && setDetailLoading(false));
    return () => { active = false; };
  }, [selectedPatientId, t]);

  async function handleNoteSubmit(event) {
    event.preventDefault();
    if (!selectedPatientId) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      try {
        await getPatientMedicalRecord(selectedPatientId);
      } catch (requestError) {
        if (requestError.response?.status !== 404) throw requestError;
        await createPatientMedicalRecord(selectedPatientId);
      }
      await createPatientMedicalNote(selectedPatientId, {
        note: noteForm.note,
      });
      await refreshPatientData(selectedPatientId);
      setNoteForm({ note: "" });
      setNotice(t("doctorWorkspace.saved"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("doctorWorkspace.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDiagnosisSubmit(event) {
    event.preventDefault();
    if (!selectedPatientId || !diagnosisText.trim()) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await createPatientDiagnosis(selectedPatientId, diagnosisText.trim());
      await refreshPatientData(selectedPatientId);
      setDiagnosisText("");
      setNotice(t("doctorWorkspace.diagnosisSaved"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("doctorWorkspace.saveError"));
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const currentPatient = patients.find((patient) => String(patient.id) === String(selectedPatientId));

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link to="/" className="text-lg font-bold text-primary" aria-label={t("accessibility.home")}>HCMS</Link>
          <div className="flex items-center gap-3"><LanguageToggle /><button type="button" onClick={handleLogout} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-background">{t("roleHome.logout")}</button></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-primary">{t("doctorWorkspace.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-bold">{t("doctorWorkspace.title")}</h1>
        {error && <p role="alert" className="mt-6 rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>}
        {notice && <p role="status" className="mt-6 rounded-xl bg-primary/10 p-4 text-sm text-primary">{notice}</p>}
        {loading ? <p className="py-12 text-center text-text-secondary">{t("doctorWorkspace.loading")}</p> : patients.length === 0 ? (
          <p className="mt-8 rounded-xl border border-border bg-surface p-6 text-text-secondary">{t("doctorWorkspace.empty")}</p>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-bold">{t("doctorWorkspace.patients")}</h2>
              <div className="mt-4 space-y-2">
                {patients.map((patient) => <button key={patient.id} type="button" onClick={() => { setError(""); if (String(patient.id) !== String(selectedPatientId)) setDetailLoading(true); setSelectedPatientId(String(patient.id)); }} className={`w-full rounded-xl px-4 py-3 text-start text-sm font-semibold ${String(patient.id) === String(selectedPatientId) ? "bg-primary text-white" : "bg-background hover:bg-primary/10"}`}>{patient.full_name}</button>)}
              </div>
            </aside>
            <div className="space-y-6">
              {detailLoading ? <p className="py-12 text-center text-text-secondary">{t("doctorWorkspace.loadingDetails")}</p> : currentPatient && <>
                <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
                  <h2 className="text-xl font-bold">{currentPatient.full_name}</h2>
                  <p className="mt-1 text-sm text-text-secondary">{currentPatient.email}</p>
                  <h3 className="mt-6 font-bold">{t("doctorWorkspace.patientReport")}</h3>
                  {intake ? <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Info label={t("patientWorkspace.currentProblem")} value={intake.current_problem} />
                    <Info label={t("patientWorkspace.symptoms")} value={intake.symptoms} />
                    <Info label={t("patientWorkspace.onset")} value={intake.symptom_onset} />
                    <Info label={t("patientWorkspace.chronicConditions")} value={answerText(t, intake.chronic_conditions_answer, intake.chronic_conditions_details)} />
                    <Info label={t("patientWorkspace.medications")} value={answerText(t, intake.medications_answer, intake.medications_details)} />
                    <Info label={t("patientWorkspace.allergies")} value={answerText(t, intake.allergies_answer, intake.allergies_details)} />
                    {intake.additional_information && <Info label={t("patientWorkspace.additionalInformation")} value={intake.additional_information} />}
                  </div> : <p className="mt-3 text-sm text-text-secondary">{t("doctorWorkspace.noIntake")}</p>}
                </section>

                <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
                  <h2 className="text-xl font-bold">{t("doctorWorkspace.diagnosesTitle")}</h2>
                  <form onSubmit={handleDiagnosisSubmit} className="mt-5 space-y-4">
                    <label className="block space-y-2 text-sm font-semibold">{t("doctorWorkspace.diagnosisLabel")}<textarea required rows={4} maxLength={10000} value={diagnosisText} onChange={(event) => setDiagnosisText(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 font-normal" /></label>
                    <button type="submit" disabled={saving || !diagnosisText.trim()} className="rounded-xl bg-primary px-6 py-3 font-semibold text-white disabled:opacity-60">{saving ? t("doctorWorkspace.saving") : t("doctorWorkspace.saveDiagnosis")}</button>
                  </form>
                  <div className="mt-6 space-y-3">{diagnoses.length ? diagnoses.map((diagnosis) => <Info key={diagnosis.id} label={`${diagnosis.doctor_name} · ${diagnosis.specialization} · ${new Date(diagnosis.documented_at).toLocaleString()}`} value={diagnosis.diagnosis} />) : <p className="text-sm text-text-secondary">{t("doctorWorkspace.noDiagnoses")}</p>}</div>
                </section>

                <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
                  <h2 className="text-xl font-bold">{t("doctorWorkspace.documentCare")}</h2>
                  <form onSubmit={handleNoteSubmit} className="mt-5 space-y-4">
                    <label className="block space-y-2 text-sm font-semibold">{t("doctorWorkspace.privateNote")}<textarea required rows={5} maxLength={10000} value={noteForm.note} onChange={(event) => setNoteForm((current) => ({ ...current, note: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 font-normal" /></label>
                    <button type="submit" disabled={saving} className="rounded-xl bg-primary px-6 py-3 font-semibold text-white disabled:opacity-60">{saving ? t("doctorWorkspace.saving") : t("doctorWorkspace.save")}</button>
                  </form>
                  {notes.length > 0 && <div className="mt-8 border-t border-border pt-6"><h3 className="font-bold">{t("doctorWorkspace.myNotes")}</h3><div className="mt-4 space-y-3">{notes.map((note) => <Info key={note.id} label={new Date(note.created_at).toLocaleString()} value={note.note} />)}</div></div>}
                </section>
              </>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function answerText(t, answer, details) {
  const label = t(`patientWorkspace.answers.${answer}`);
  return answer === "YES" && details ? `${label} — ${details}` : label;
}

function Info({ label, value }) {
  return <div className="rounded-xl border border-border bg-background p-4"><p className="text-xs font-semibold text-text-secondary">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{value || "—"}</p></div>;
}

export default DoctorHome;
