import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";

const EMPTY_FORM = {
  current_problem: "",
  symptoms: "",
  symptom_onset: "",
  chronic_conditions_answer: "UNKNOWN",
  chronic_conditions_details: "",
  medications_answer: "UNKNOWN",
  medications_details: "",
  allergies_answer: "UNKNOWN",
  allergies_details: "",
  additional_information: "",
};

function formFromIntake(intake) {
  return Object.fromEntries(
    Object.keys(EMPTY_FORM).map((field) => [field, intake[field] ?? EMPTY_FORM[field]]),
  );
}

export default function usePatientWorkspace() {
  const { t } = useTranslation();
  const { patientIntake, patientWorkspace } = useApplicationServices();
  const [intake, setIntake] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [alertForm, setAlertForm] = useState({ phone: "", location: "", description: "" });
  const [alertNotice, setAlertNotice] = useState("");
  const [alertError, setAlertError] = useState("");
  const [isAlertSubmitting, setIsAlertSubmitting] = useState(false);
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [correctionMessage, setCorrectionMessage] = useState("");
  const [correctionNotice, setCorrectionNotice] = useState("");
  const [correctionError, setCorrectionError] = useState("");
  const [isCorrectionSubmitting, setIsCorrectionSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    patientIntake.getPatientIntake()
      .then((response) => {
        if (!active) return;
        const savedIntake = response.data.intake;
        setIntake(savedIntake);
        if (!savedIntake) return;

        setForm(formFromIntake(savedIntake));
        if (["UNDER_REVIEW", "DOCTOR_ASSIGNED"].includes(savedIntake.status)) {
          patientWorkspace.listPatientIntakeCorrectionRequests()
            .then((response) => active && setCorrectionRequests(response.data.requests))
            .catch(() => {});
        }
        if (savedIntake.status === "DOCTOR_ASSIGNED") {
          patientWorkspace.getPatientAssignments()
            .then((response) => active && setAssignments(response.data.assignments))
            .catch(() => {});
          patientWorkspace.listOwnDiagnoses()
            .then((response) => active && setDiagnoses(response.data.diagnoses))
            .catch(() => {});
        }
      })
      .catch(() => {
        if (active) setError(t("patientWorkspace.loadError"));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [patientIntake, patientWorkspace, t]);

  useEffect(() => {
    let active = true;
    patientWorkspace.getOwnProfile().then((response) => active && setProfile(response.data.profile)).catch(() => {});
    patientWorkspace.getPatientAlerts().then((response) => active && setAlerts(response.data.emergency_alerts)).catch(() => {});
    return () => { active = false; };
  }, [patientWorkspace]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setNotice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const request = intake ? patientIntake.updatePatientIntake : patientIntake.submitPatientIntake;
      const response = await request(form);
      setIntake(response.data.intake);
      setForm(formFromIntake(response.data.intake));
      setNotice(t(intake ? "patientWorkspace.updated" : "patientWorkspace.submitted"));
    } catch (requestError) {
      setError(requestError.response?.status === 409
        ? t("patientWorkspace.lockedError")
        : t("patientWorkspace.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAlertSubmit(event) {
    event.preventDefault();
    setIsAlertSubmitting(true);
    setAlertError("");
    setAlertNotice("");
    try {
      const response = await patientWorkspace.createPatientAlert(alertForm);
      setAlerts((current) => [response.data.emergency_alert, ...current]);
      setAlertForm({ phone: "", location: "", description: "" });
      setAlertNotice(t("patientWorkspace.alertSubmitted"));
    } catch {
      setAlertError(t("patientWorkspace.alertError"));
    } finally {
      setIsAlertSubmitting(false);
    }
  }

  async function handleCorrectionSubmit(event) {
    event.preventDefault();
    setIsCorrectionSubmitting(true);
    setCorrectionError("");
    setCorrectionNotice("");
    try {
      const response = await patientWorkspace.createPatientIntakeCorrectionRequest(correctionMessage);
      setCorrectionRequests((current) => [response.data.request, ...current]);
      setCorrectionMessage("");
      setCorrectionNotice(t("patientWorkspace.correctionSent"));
    } catch (requestError) {
      setCorrectionError(requestError.response?.data?.message || t("patientWorkspace.correctionError"));
    } finally {
      setIsCorrectionSubmitting(false);
    }
  }

  const canEdit = !intake || intake.status === "SUBMITTED";
  const statusLabel = intake
    ? t(`patientWorkspace.status.${intake.status}`)
    : t("patientWorkspace.status.NOT_SUBMITTED");

  return {
    t, intake, form, isLoading, isSaving, error, notice, profile, alerts,
    assignments, diagnoses, alertForm, setAlertForm, alertNotice, alertError,
    isAlertSubmitting, correctionRequests, correctionMessage, setCorrectionMessage,
    correctionNotice, correctionError, isCorrectionSubmitting, canEdit, statusLabel,
    updateField, handleSubmit, handleAlertSubmit, handleCorrectionSubmit,
  };
}
