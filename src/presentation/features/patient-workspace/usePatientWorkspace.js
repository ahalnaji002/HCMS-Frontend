import { useCallback, useEffect, useState } from "react";
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

const EMPTY_PROFILE_FORM = {
  full_name: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  address: "",
};

function profileFormFrom(profile) {
  return {
    full_name: profile.full_name || "",
    phone: profile.phone || "",
    date_of_birth: profile.date_of_birth || "",
    gender: profile.gender || "",
    address: profile.address || "",
  };
}

function requestErrorMessage(error, t, fallback) {
  const status = error.response?.status;
  if (status === 403) return t("patientWorkspace.errors.forbidden");
  if (status >= 500) return t("patientWorkspace.errors.server");
  if (!error.response) return t("patientWorkspace.errors.network");
  return t(fallback);
}

function isValidDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function localToday() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function validateProfile(form, t) {
  const errors = {};
  if (!form.full_name.trim()) errors.full_name = t("patientWorkspace.profileValidation.nameRequired");
  else if (form.full_name.trim().length > 150) errors.full_name = t("patientWorkspace.profileValidation.nameTooLong");
  if (form.phone && !/^(059|056)\d{7}$/.test(form.phone.trim())) errors.phone = t("patientWorkspace.profileValidation.phone");
  if (!isValidDateOnly(form.date_of_birth)) errors.date_of_birth = t("patientWorkspace.profileValidation.date");
  else if (form.date_of_birth > localToday()) errors.date_of_birth = t("patientWorkspace.profileValidation.futureDate");
  if (!["MALE", "FEMALE"].includes(form.gender)) errors.gender = t("patientWorkspace.profileValidation.gender");
  if (form.address.length > 255) errors.address = t("patientWorkspace.profileValidation.address");
  return errors;
}

function serverProfileFieldErrors(error, t) {
  const serverErrors = error.response?.data?.errors;
  if (!serverErrors || typeof serverErrors !== "object") return {};
  return Object.fromEntries(Object.keys(EMPTY_PROFILE_FORM)
    .filter((field) => Object.prototype.hasOwnProperty.call(serverErrors, field))
    .map((field) => [field, t("patientWorkspace.profileValidation.serverField")]));
}

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
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE_FORM);
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState("");
  const [diagnoses, setDiagnoses] = useState([]);
  const [diagnosesLoading, setDiagnosesLoading] = useState(true);
  const [diagnosesError, setDiagnosesError] = useState("");
  const [alertForm, setAlertForm] = useState({ phone: "", location: "", description: "" });
  const [alertNotice, setAlertNotice] = useState("");
  const [alertError, setAlertError] = useState("");
  const [isAlertSubmitting, setIsAlertSubmitting] = useState(false);
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [correctionMessage, setCorrectionMessage] = useState("");
  const [correctionNotice, setCorrectionNotice] = useState("");
  const [correctionError, setCorrectionError] = useState("");
  const [isCorrectionSubmitting, setIsCorrectionSubmitting] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const response = await patientWorkspace.getOwnProfile();
      setProfile(response.data.profile);
      setProfileForm(profileFormFrom(response.data.profile));
    } catch (requestError) {
      if (requestError.response?.status === 403) {
        setProfile(null);
        setProfileForm(EMPTY_PROFILE_FORM);
      }
      setProfileError(requestErrorMessage(requestError, t, "patientWorkspace.profileError"));
    } finally {
      setProfileLoading(false);
    }
  }, [patientWorkspace, t]);

  const loadAlerts = useCallback(async () => {
    try {
      const response = await patientWorkspace.getPatientAlerts();
      setAlerts(response.data.emergency_alerts);
    } catch (requestError) {
      setAlerts([]);
      setAlertsError(requestErrorMessage(requestError, t, "patientWorkspace.alertLoadError"));
    } finally {
      setAlertsLoading(false);
    }
  }, [patientWorkspace, t]);

  const loadAssignments = useCallback(async () => {
    try {
      const response = await patientWorkspace.getPatientAssignments();
      setAssignments(response.data.assignments);
    } catch (requestError) {
      setAssignments([]);
      setAssignmentsError(requestErrorMessage(requestError, t, "patientWorkspace.assignmentsError"));
    } finally {
      setAssignmentsLoading(false);
    }
  }, [patientWorkspace, t]);

  const loadDiagnoses = useCallback(async () => {
    try {
      const response = await patientWorkspace.listOwnDiagnoses();
      setDiagnoses(response.data.diagnoses);
    } catch (requestError) {
      setDiagnoses([]);
      setDiagnosesError(requestErrorMessage(requestError, t, "patientWorkspace.diagnosesError"));
    } finally {
      setDiagnosesLoading(false);
    }
  }, [patientWorkspace, t]);

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
          loadAssignments();
          loadDiagnoses();
        }
      })
      .catch(() => {
        if (active) setError(t("patientWorkspace.loadError"));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [loadAssignments, loadDiagnoses, patientIntake, patientWorkspace, t]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      loadProfile();
      loadAlerts();
    });
    return () => { active = false; };
  }, [loadAlerts, loadProfile]);

  function updateProfileField(event) {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
    setProfileFieldErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
    setProfileError("");
    setProfileNotice("");
  }

  function retryProfile() {
    setProfileLoading(true);
    setProfileError("");
    loadProfile();
  }

  function retryAlerts() {
    setAlertsLoading(true);
    setAlertsError("");
    loadAlerts();
  }

  function retryAssignments() {
    setAssignmentsLoading(true);
    setAssignmentsError("");
    loadAssignments();
  }

  function retryDiagnoses() {
    setDiagnosesLoading(true);
    setDiagnosesError("");
    loadDiagnoses();
  }

  function cancelProfileEdit() {
    if (profile) setProfileForm(profileFormFrom(profile));
    setProfileFieldErrors({});
    setProfileError("");
    setProfileEditing(false);
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    const validationErrors = validateProfile(profileForm, t);
    setProfileFieldErrors(validationErrors);
    setProfileError("");
    setProfileNotice("");
    if (Object.keys(validationErrors).length) return;

    setProfileSaving(true);
    const payload = {
      full_name: profileForm.full_name.trim(),
      phone: profileForm.phone.trim() || null,
      date_of_birth: profileForm.date_of_birth,
      gender: profileForm.gender,
      address: profileForm.address.trim() || null,
    };
    try {
      const response = await patientWorkspace.updateOwnProfile(payload);
      const updatedProfile = response.data.profile;
      setProfile(updatedProfile);
      setProfileForm(profileFormFrom(updatedProfile));
      setProfileEditing(false);
      setProfileFieldErrors({});
      setProfileNotice(t("patientWorkspace.profileSaved"));
    } catch (requestError) {
      if (requestError.response?.status === 403) {
        setProfile(null);
        setProfileForm(EMPTY_PROFILE_FORM);
        setProfileEditing(false);
      }
      setProfileError(requestErrorMessage(requestError, t, "patientWorkspace.profileSaveError"));
      setProfileFieldErrors(serverProfileFieldErrors(requestError, t));
    } finally {
      setProfileSaving(false);
    }
  }

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
    t, intake, form, isLoading, isSaving, error, notice,
    profile, profileLoading, profileError, profileNotice, profileForm, profileFieldErrors,
    profileEditing, profileSaving, alerts, alertsLoading, alertsError,
    assignments, assignmentsLoading, assignmentsError, diagnoses, diagnosesLoading, diagnosesError,
    alertForm, setAlertForm, alertNotice, alertError,
    isAlertSubmitting, correctionRequests, correctionMessage, setCorrectionMessage,
    correctionNotice, correctionError, isCorrectionSubmitting, canEdit, statusLabel,
    updateField, handleSubmit, handleAlertSubmit, handleCorrectionSubmit,
    retryProfile, retryAlerts, retryAssignments, retryDiagnoses,
    updateProfileField, cancelProfileEdit, handleProfileSubmit, setProfileEditing,
  };
}
