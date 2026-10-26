import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";

function messageForRequestError(error, t, fallbackKey) {
  const status = error.response?.status;

  if (status === 403) return t("doctorWorkspace.accessDenied");
  if (status >= 500) return t("doctorWorkspace.serverError");
  if (!error.response) return t("doctorWorkspace.networkError");

  return t(fallbackKey);
}

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
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [medicalRecord, setMedicalRecord] = useState(null);

  const clearPatientData = useCallback(() => {
    setIntake(null);
    setNotes([]);
    setDiagnoses([]);
    setDiagnosisText("");
    setNoteForm({ note: "" });
    setMedicalRecord(null);
  }, []);

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
        clearPatientData();
        setSelectedPatientId(assignedPatients[0] ? String(assignedPatients[0].id) : "");
        setDetailLoading(Boolean(assignedPatients[0]));
      })
      .catch((requestError) => {
        if (!active) return;

        clearPatientData();
        setPatients([]);
        setSelectedPatientId("");
        setError(messageForRequestError(requestError, t, "doctorWorkspace.loadError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [clearPatientData, doctorWorkspace, t]);

  useEffect(() => {
    if (!selectedPatientId) return undefined;

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
        doctorWorkspace.getPatientMedicalRecord(selectedPatientId)
          .then((response) => active && setMedicalRecord(response.data.medical_record))
          .catch(() => {});
      })
      .catch((requestError) => {
        if (!active) return;

        clearPatientData();
        setSelectedPatientId("");
        setError(messageForRequestError(requestError, t, "doctorWorkspace.detailError"));
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [clearPatientData, doctorWorkspace, selectedPatientId, t]);

  function selectPatient(patientId) {
    if (String(patientId) === String(selectedPatientId)) return;

    clearPatientData();
    setError("");
    setNotice("");
    setDetailLoading(true);
    setSelectedPatientId(String(patientId));
  }

  function handlePatientAccessLoss(requestError) {
    if (requestError.response?.status !== 403) return;

    clearPatientData();
    setSelectedPatientId("");
  }

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
      handlePatientAccessLoss(requestError);
      setError(messageForRequestError(requestError, t, "doctorWorkspace.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function saveMedicalRecord(payload) {
    if (!selectedPatientId) return;
    setSaving(true); setError(""); setNotice("");
    try {
      let record;
      try {
        record = await doctorWorkspace.getPatientMedicalRecord(selectedPatientId);
      } catch (requestError) {
        if (requestError.response?.status !== 404) throw requestError;
        record = await doctorWorkspace.createPatientMedicalRecord(selectedPatientId);
      }
      const response = await doctorWorkspace.updatePatientMedicalRecord(selectedPatientId, payload);
      setMedicalRecord(response.data.medical_record || record.data.medical_record);
      setNotice(t("doctorWorkspace.recordSaved"));
    } catch (requestError) {
      handlePatientAccessLoss(requestError);
      setError(messageForRequestError(requestError, t, "doctorWorkspace.saveError"));
    } finally { setSaving(false); }
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
      handlePatientAccessLoss(requestError);
      setError(messageForRequestError(requestError, t, "doctorWorkspace.saveError"));
    } finally {
      setSaving(false);
    }
  }

  const currentPatient = patients.find((patient) => String(patient.id) === String(selectedPatientId));

  return {
    t, patients, selectedPatientId, selectPatient, intake, notes, diagnoses, medicalRecord,
    diagnosisText, setDiagnosisText, noteForm, setNoteForm, loading, detailLoading,
    saving, error, setError, notice, currentPatient,
    handleNoteSubmit, handleDiagnosisSubmit, saveMedicalRecord,
  };
}
