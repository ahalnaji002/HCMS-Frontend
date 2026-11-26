import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { useToast } from "@/presentation/components/ui";

function errorKey(error, fallbackKey) {
  const status = error.response?.status;

  if (status === 403) return "doctorWorkspace.accessDenied";
  if (status >= 500) return "doctorWorkspace.serverError";
  if (!error.response) return "doctorWorkspace.networkError";

  return fallbackKey;
}

export default function useDoctorWorkspace() {
  const { t } = useTranslation();
  const { doctorWorkspace } = useApplicationServices();
  // Action results go to the shared toast; a failed patient-list load is shown in place.
  const toast = useToast();
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
  const [loadError, setLoadError] = useState("");
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
        setLoadError(errorKey(requestError, "doctorWorkspace.loadError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [clearPatientData, doctorWorkspace]);

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
        toast.error({ key: errorKey(requestError, "doctorWorkspace.detailError") });
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [clearPatientData, doctorWorkspace, selectedPatientId, toast]);

  function selectPatient(patientId) {
    if (String(patientId) === String(selectedPatientId)) return;

    clearPatientData();
    setDetailLoading(true);
    setSelectedPatientId(String(patientId));
  }

  function handlePatientAccessLoss(requestError) {
    if (requestError.response?.status !== 403) return;

    clearPatientData();
    setSelectedPatientId("");
  }

  const handleAssistanceAccessLoss = useCallback(() => {
    clearPatientData();
    setSelectedPatientId("");
    toast.error({ key: "doctorWorkspace.accessDenied" });
  }, [clearPatientData, toast]);

  async function handleNoteSubmit(event) {
    event.preventDefault();
    if (!selectedPatientId) return;
    setSaving(true);

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
      toast.success({ key: "doctorWorkspace.saved" });
    } catch (requestError) {
      handlePatientAccessLoss(requestError);
      toast.error({ key: errorKey(requestError, "doctorWorkspace.saveError") });
    } finally {
      setSaving(false);
    }
  }

  // Returns true when saved, so the form can treat the values as stored.
  async function saveMedicalRecord(payload) {
    if (!selectedPatientId) return false;
    setSaving(true);
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
      toast.success({ key: "doctorWorkspace.recordSaved" });
      return true;
    } catch (requestError) {
      handlePatientAccessLoss(requestError);
      toast.error({ key: errorKey(requestError, "doctorWorkspace.saveError") });
      return false;
    } finally { setSaving(false); }
  }

  async function handleDiagnosisSubmit(event) {
    event.preventDefault();
    if (!selectedPatientId || !diagnosisText.trim()) return;
    setSaving(true);

    try {
      await doctorWorkspace.createPatientDiagnosis(selectedPatientId, diagnosisText.trim());
      await refreshPatientData(selectedPatientId);
      setDiagnosisText("");
      toast.success({ key: "doctorWorkspace.diagnosisSaved" });
    } catch (requestError) {
      handlePatientAccessLoss(requestError);
      toast.error({ key: errorKey(requestError, "doctorWorkspace.saveError") });
    } finally {
      setSaving(false);
    }
  }

  const currentPatient = patients.find((patient) => String(patient.id) === String(selectedPatientId));

  return {
    t, patients, selectedPatientId, selectPatient, intake, notes, diagnoses, medicalRecord,
    diagnosisText, setDiagnosisText, noteForm, setNoteForm, loading, detailLoading,
    saving, loadError, currentPatient,
    handleNoteSubmit, handleDiagnosisSubmit, saveMedicalRecord, handleAssistanceAccessLoss,
  };
}
