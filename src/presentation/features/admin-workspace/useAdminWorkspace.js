import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { translateServerMessage } from "@/presentation/utils/serverMessages";

export default function useAdminWorkspace() {
  const { t } = useTranslation();
  const { admin } = useApplicationServices();
  const [intakes, setIntakes] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [reasons, setReasons] = useState({});
  const [selectedDoctors, setSelectedDoctors] = useState({});
  const [workloadDrafts, setWorkloadDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [correctionResponses, setCorrectionResponses] = useState({});
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [emergencyDoctors, setEmergencyDoctors] = useState({});

  const refresh = useCallback(async () => {
    const [intakeResponse, doctorResponse, correctionResponse, emergencyResponse] = await Promise.all([
      admin.listPatientIntakes(),
      admin.listActiveDoctors(),
      admin.listIntakeCorrectionRequests(),
      admin.listAdminEmergencyAlerts(),
    ]);
    setIntakes(intakeResponse.data.intakes);
    setCorrectionRequests(correctionResponse.data.requests);
    setEmergencyAlerts(emergencyResponse.data.emergency_alerts);
    const activeDoctors = doctorResponse.data.doctors;
    setDoctors(activeDoctors);
    setWorkloadDrafts(Object.fromEntries(activeDoctors.map((doctor) => [doctor.id, {
      availability: doctor.availability,
      capacity_limit: doctor.capacity_limit ?? "",
    }])));
  }, [admin]);

  useEffect(() => {
    let active = true;
    Promise.all([admin.listPatientIntakes(), admin.listActiveDoctors(), admin.listIntakeCorrectionRequests(), admin.listAdminEmergencyAlerts()])
      .then(([intakeResponse, doctorResponse, correctionResponse, emergencyResponse]) => {
        if (!active) return;
        setIntakes(intakeResponse.data.intakes);
        setCorrectionRequests(correctionResponse.data.requests);
        setEmergencyAlerts(emergencyResponse.data.emergency_alerts);
        const activeDoctors = doctorResponse.data.doctors;
        setDoctors(activeDoctors);
        setWorkloadDrafts(Object.fromEntries(activeDoctors.map((doctor) => [doctor.id, {
          availability: doctor.availability,
          capacity_limit: doctor.capacity_limit ?? "",
        }])));
      })
      .catch(() => {
        if (active) setError({ key: "adminIntakes.loadError" });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [admin, t]);

  async function handleStartReview(intakeId) {
    setBusyId(intakeId);
    setError(null);
    setNotice(null);
    try {
      await admin.startPatientIntakeReview(intakeId);
      await refresh();
      setNotice({ key: "adminIntakes.reviewStarted" });
    } catch (requestError) {
      setError({ server: requestError.response?.data?.message, key: "adminIntakes.actionError" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleAssign(intake) {
    const doctorId = selectedDoctors[intake.id];
    const assignmentReason = reasons[intake.id]?.trim();
    if (!doctorId || !assignmentReason) {
      setError({ key: "adminIntakes.assignmentRequired" });
      return;
    }
    setBusyId(intake.id);
    setError(null);
    setNotice(null);
    try {
      await admin.assignDoctorToPatient({
        doctor_id: doctorId,
        patient_id: intake.patient_id,
        assignment_reason: assignmentReason,
      });
      setReasons((current) => ({ ...current, [intake.id]: "" }));
      await refresh();
      setNotice({ key: "adminIntakes.assignmentSaved" });
    } catch (requestError) {
      setError({ server: requestError.response?.data?.message, key: "adminIntakes.actionError" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleEmergencyAssign(alert) {
    const doctorId = emergencyDoctors[alert.id];
    if (!doctorId) {
      setError({ key: "adminIntakes.emergencyDoctorRequired" });
      return;
    }
    setBusyId(`emergency-${alert.id}`);
    setError(null);
    setNotice(null);
    try {
      await admin.assignDoctorToEmergencyAlert(alert.id, doctorId);
      await refresh();
      setNotice({ key: "adminIntakes.emergencyAssigned" });
    } catch (requestError) {
      setError({ server: requestError.response?.data?.message, key: "adminIntakes.actionError" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveWorkload(doctor) {
    const draft = workloadDrafts[doctor.id];
    if (!draft) return;
    setBusyId(`doctor-${doctor.id}`);
    setError(null);
    setNotice(null);
    try {
      await admin.updateDoctorWorkload(doctor.id, {
        availability: draft.availability,
        capacity_limit: draft.capacity_limit === "" ? null : Number(draft.capacity_limit),
      });
      await refresh();
      setNotice({ key: "adminIntakes.workloadSaved" });
    } catch (requestError) {
      setError({ server: requestError.response?.data?.message, key: "adminIntakes.actionError" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolveCorrection(request) {
    setBusyId(`correction-${request.id}`);
    setError(null);
    setNotice(null);
    try {
      await admin.resolveIntakeCorrectionRequest(request.id, correctionResponses[request.id] || "");
      await refresh();
      setNotice({ key: "adminIntakes.correctionResolved" });
    } catch (requestError) {
      setError({ server: requestError.response?.data?.message, key: "adminIntakes.actionError" });
    } finally {
      setBusyId(null);
    }
  }


  // Messages are kept as translation keys (or server text) and translated on
  // render, so they follow language changes.
  const translate = (message) => {
    if (!message) return "";
    if (message.server) return translateServerMessage(t, message.server, message.key);
    return message.key ? t(message.key) : message.text;
  };
  const clearMessages = useCallback(() => {
    setError(null);
    setNotice(null);
  }, []);

  return {
    t, intakes, doctors, reasons, setReasons, selectedDoctors, setSelectedDoctors,
    workloadDrafts, setWorkloadDrafts, loading, busyId,
    error: translate(error), notice: translate(notice), clearMessages,
    correctionRequests, correctionResponses, setCorrectionResponses, emergencyAlerts,
    emergencyDoctors, setEmergencyDoctors, handleStartReview, handleAssign,
    handleEmergencyAssign, handleSaveWorkload, handleResolveCorrection,
  };
}