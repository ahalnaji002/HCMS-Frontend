import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";

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
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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
        if (active) setError(t("adminIntakes.loadError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [admin, t]);

  async function handleStartReview(intakeId) {
    setBusyId(intakeId);
    setError("");
    setNotice("");
    try {
      await admin.startPatientIntakeReview(intakeId);
      await refresh();
      setNotice(t("adminIntakes.reviewStarted"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("adminIntakes.actionError"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleAssign(intake) {
    const doctorId = selectedDoctors[intake.id];
    const assignmentReason = reasons[intake.id]?.trim();
    if (!doctorId || !assignmentReason) {
      setError(t("adminIntakes.assignmentRequired"));
      return;
    }
    setBusyId(intake.id);
    setError("");
    setNotice("");
    try {
      await admin.assignDoctorToPatient({
        doctor_id: doctorId,
        patient_id: intake.patient_id,
        assignment_reason: assignmentReason,
      });
      setReasons((current) => ({ ...current, [intake.id]: "" }));
      await refresh();
      setNotice(t("adminIntakes.assignmentSaved"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("adminIntakes.actionError"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleEmergencyAssign(alert) {
    const doctorId = emergencyDoctors[alert.id];
    if (!doctorId) {
      setError(t("adminIntakes.emergencyDoctorRequired"));
      return;
    }
    setBusyId(`emergency-${alert.id}`);
    setError("");
    setNotice("");
    try {
      await admin.assignDoctorToEmergencyAlert(alert.id, doctorId);
      await refresh();
      setNotice(t("adminIntakes.emergencyAssigned"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("adminIntakes.actionError"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveWorkload(doctor) {
    const draft = workloadDrafts[doctor.id];
    if (!draft) return;
    setBusyId(`doctor-${doctor.id}`);
    setError("");
    setNotice("");
    try {
      await admin.updateDoctorWorkload(doctor.id, {
        availability: draft.availability,
        capacity_limit: draft.capacity_limit === "" ? null : Number(draft.capacity_limit),
      });
      await refresh();
      setNotice(t("adminIntakes.workloadSaved"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("adminIntakes.actionError"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolveCorrection(request) {
    setBusyId(`correction-${request.id}`);
    setError("");
    setNotice("");
    try {
      await admin.resolveIntakeCorrectionRequest(request.id, correctionResponses[request.id] || "");
      await refresh();
      setNotice(t("adminIntakes.correctionResolved"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("adminIntakes.actionError"));
    } finally {
      setBusyId(null);
    }
  }


  return {
    t, intakes, doctors, reasons, setReasons, selectedDoctors, setSelectedDoctors,
    workloadDrafts, setWorkloadDrafts, loading, busyId, error, notice,
    correctionRequests, correctionResponses, setCorrectionResponses, emergencyAlerts,
    emergencyDoctors, setEmergencyDoctors, handleStartReview, handleAssign,
    handleEmergencyAssign, handleSaveWorkload, handleResolveCorrection,
  };
}