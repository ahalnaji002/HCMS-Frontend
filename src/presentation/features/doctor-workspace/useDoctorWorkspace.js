import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";

export default function useDoctorWorkspace() {
  const { t } = useTranslation();
  const { doctorWorkspace } = useApplicationServices();
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
      doctorWorkspace.getAssignedPatientIntake(patientId),
      doctorWorkspace.listOwnPatientNotes(patientId),
      doctorWorkspace.listPatientDiagnoses(patientId),
    ]);
    setIntake(intakeResponse.data.intake);
    setNotes(noteResponse.data.medical_notes);
    setDiagnoses(diagnosisResponse.data.diagnoses);
  }, [doctorWorkspace]);

  useEffect(() => {
    let active = true;
    doctorWorkspace.listAssignedPatients()
      .then((response) => {
        if (!active) return;
        const assignedPatients = response.data.patients;
        setPatients(assignedPatients);
        setSelectedPatientId(assignedPatients[0] ? String(assignedPatients[0].id) : "");
      })
      .catch(() => active && setError(t("doctorWorkspace.loadError")))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [doctorWorkspace, t]);

  useEffect(() => {
    if (!selectedPatientId) {
      return undefined;
    }
    let active = true;
    Promise.all([
      doctorWorkspace.getAssignedPatientIntake(selectedPatientId),
      doctorWorkspace.listOwnPatientNotes(selectedPatientId),
      doctorWorkspace.listPatientDiagnoses(selectedPatientId),
    ])
      .then(([intakeResponse, noteResponse, diagnosisResponse]) => {
        if (!active) return;
        setIntake(intakeResponse.data.intake);
        setNotes(noteResponse.data.medical_notes);
        setDiagnoses(diagnosisResponse.data.diagnoses);
      })
      .catch(() => active && setError(t("doctorWorkspace.detailError")))
      .finally(() => active && setDetailLoading(false));
    return () => { active = false; };
  }, [doctorWorkspace, selectedPatientId, t]);

  async function handleNoteSubmit(event) {
    event.preventDefault();
    if (!selectedPatientId) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      try {
        await doctorWorkspace.getPatientMedicalRecord(selectedPatientId);
      } catch (requestError) {
        if (requestError.response?.status !== 404) throw requestError;
        await doctorWorkspace.createPatientMedicalRecord(selectedPatientId);
      }
      await doctorWorkspace.createPatientMedicalNote(selectedPatientId, {
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
      await doctorWorkspace.createPatientDiagnosis(selectedPatientId, diagnosisText.trim());
      await refreshPatientData(selectedPatientId);
      setDiagnosisText("");
      setNotice(t("doctorWorkspace.diagnosisSaved"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("doctorWorkspace.saveError"));
    } finally {
      setSaving(false);
    }
  }

  const currentPatient = patients.find((patient) => String(patient.id) === String(selectedPatientId));


  return {
    t, patients, selectedPatientId, setSelectedPatientId, intake, notes, diagnoses,
    diagnosisText, setDiagnosisText, noteForm, setNoteForm, loading, detailLoading,
    setDetailLoading, saving, error, setError, notice, currentPatient,
    handleNoteSubmit, handleDiagnosisSubmit,
  };
}