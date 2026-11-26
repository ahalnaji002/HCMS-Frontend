import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { useToast } from "@/presentation/components/ui";

export default function useAdminWorkspace() {
  const { t } = useTranslation();
  const { admin } = useApplicationServices();
  // Feedback goes through the shared toast: messages are translation
  // descriptors, so they follow language changes and clear on page change.
  const toast = useToast();
  const [intakes, setIntakes] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [reasons, setReasons] = useState({});
  const [selectedDoctors, setSelectedDoctors] = useState({});
  const [workloadDrafts, setWorkloadDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [correctionResponses, setCorrectionResponses] = useState({});
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [emergencyDoctors, setEmergencyDoctors] = useState({});
  const [emergencyLoading, setEmergencyLoading] = useState(true);
  const [emergencyLoadError, setEmergencyLoadError] = useState(false);

  const refreshEmergencyAlerts = useCallback(async () => {
    const response = await admin.listAdminEmergencyAlerts();
    setEmergencyAlerts(response.data.emergency_alerts);
    setEmergencyLoadError(false);
  }, [admin]);

  const refresh = useCallback(async () => {
    const [intakeResponse, doctorResponse, correctionResponse] = await Promise.all([
      admin.listPatientIntakes(),
      admin.listActiveDoctors(),
      admin.listIntakeCorrectionRequests(),
    ]);
    setIntakes(intakeResponse.data.intakes);
    setCorrectionRequests(correctionResponse.data.requests);
    const activeDoctors = doctorResponse.data.doctors;
    setDoctors(activeDoctors);
    setWorkloadDrafts(Object.fromEntries(activeDoctors.map((doctor) => [doctor.id, {
      availability: doctor.availability,
      capacity_limit: doctor.capacity_limit ?? "",
    }])));
    await refreshEmergencyAlerts();
  }, [admin, refreshEmergencyAlerts]);

  useEffect(() => {
    let active = true;
    Promise.all([admin.listPatientIntakes(), admin.listActiveDoctors(), admin.listIntakeCorrectionRequests()])
      .then(([intakeResponse, doctorResponse, correctionResponse]) => {
        if (!active) return;
        setIntakes(intakeResponse.data.intakes);
        setCorrectionRequests(correctionResponse.data.requests);
        const activeDoctors = doctorResponse.data.doctors;
        setDoctors(activeDoctors);
        setWorkloadDrafts(Object.fromEntries(activeDoctors.map((doctor) => [doctor.id, {
          availability: doctor.availability,
          capacity_limit: doctor.capacity_limit ?? "",
        }])));
      })
      .catch(() => {
        if (active) toast.error({ key: "adminIntakes.loadError" });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    admin.listAdminEmergencyAlerts()
      .then((response) => {
        if (active) {
          setEmergencyAlerts(response.data.emergency_alerts);
          setEmergencyLoadError(false);
        }
      })
      .catch(() => {
        if (active) setEmergencyLoadError(true);
      })
      .finally(() => {
        if (active) setEmergencyLoading(false);
      });
    return () => { active = false; };
  }, [admin, toast]);

  async function handleRefreshEmergencyAlerts() {
    setEmergencyLoading(true);
    try {
      await refreshEmergencyAlerts();
    } catch {
      setEmergencyLoadError(true);
    } finally {
      setEmergencyLoading(false);
    }
  }

  async function handleStartReview(intakeId) {
    setBusyId(intakeId);
    try {
      await admin.startPatientIntakeReview(intakeId);
      await refresh();
      toast.success({ key: "adminIntakes.reviewStarted" });
    } catch (requestError) {
      toast.error({ server: requestError.response?.data?.message, key: "adminIntakes.actionError" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleAssign(intake) {
    const doctorId = selectedDoctors[intake.id];
    const assignmentReason = reasons[intake.id]?.trim();
    if (!doctorId || !assignmentReason) {
      toast.error({ key: "adminIntakes.assignmentRequired" });
      return;
    }
    setBusyId(intake.id);
    try {
      await admin.assignDoctorToPatient({
        doctor_id: doctorId,
        patient_id: intake.patient_id,
        assignment_reason: assignmentReason,
      });
      setReasons((current) => ({ ...current, [intake.id]: "" }));
      await refresh();
      toast.success({ key: "adminIntakes.assignmentSaved" });
    } catch (requestError) {
      toast.error({ server: requestError.response?.data?.message, key: "adminIntakes.actionError" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleEmergencyAssign(alert) {
    const doctorId = emergencyDoctors[alert.id];
    if (!doctorId) {
      toast.error({ key: "adminIntakes.emergencyDoctorRequired" });
      return;
    }
    setBusyId(`emergency-${alert.id}`);
    try {
      await admin.assignDoctorToEmergencyAlert(alert.id, Number(doctorId));
      setEmergencyDoctors((current) => {
        const next = { ...current };
        delete next[alert.id];
        return next;
      });
      toast.success({ key: "adminIntakes.emergencyAssigned" });
      try {
        await refreshEmergencyAlerts();
      } catch {
        toast.error({ key: "adminIntakes.emergencyRefreshError" });
      }
    } catch (requestError) {
      const status = requestError.response?.status;
      setEmergencyDoctors((current) => {
        const next = { ...current };
        delete next[alert.id];
        return next;
      });
      if (status === 404 || status === 409) {
        await handleRefreshEmergencyAlerts();
      }
      toast.error({
        server: requestError.response?.data?.message,
        key: status === 403
          ? "adminIntakes.emergencyForbidden"
          : status === 404
            ? "serverMessages.emergencyNotFound"
            : status === 409
              ? "serverMessages.emergencyNoLongerPending"
              : "adminIntakes.actionError",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveWorkload(doctor) {
    const draft = workloadDrafts[doctor.id];
    if (!draft) return;
    setBusyId(`doctor-${doctor.id}`);
    try {
      await admin.updateDoctorWorkload(doctor.id, {
        availability: draft.availability,
        capacity_limit: draft.capacity_limit === "" ? null : Number(draft.capacity_limit),
      });
      await refresh();
      toast.success({ key: "adminIntakes.workloadSaved" });
    } catch (requestError) {
      toast.error({ server: requestError.response?.data?.message, key: "adminIntakes.actionError" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolveCorrection(request) {
    setBusyId(`correction-${request.id}`);
    try {
      await admin.resolveIntakeCorrectionRequest(request.id, correctionResponses[request.id] || "");
      await refresh();
      toast.success({ key: "adminIntakes.correctionResolved" });
    } catch (requestError) {
      toast.error({ server: requestError.response?.data?.message, key: "adminIntakes.actionError" });
    } finally {
      setBusyId(null);
    }
  }

  return {
    t, intakes, doctors, reasons, setReasons, selectedDoctors, setSelectedDoctors,
    workloadDrafts, setWorkloadDrafts, loading, busyId,
    correctionRequests, correctionResponses, setCorrectionResponses, emergencyAlerts,
    emergencyDoctors, setEmergencyDoctors, emergencyLoading, emergencyLoadError,
    handleRefreshEmergencyAlerts, handleStartReview, handleAssign,
    handleEmergencyAssign, handleSaveWorkload, handleResolveCorrection,
  };
}
