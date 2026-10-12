import api from "@/infrastructure/http/apiClient";

export async function getOwnProfile() {
  return api.get("/api/profile");
}

export async function getPatientAlerts() {
  return api.get("/api/patient/emergency-alerts");
}

export async function createPatientAlert(payload) {
  return api.post("/api/patient/emergency-alerts", payload);
}

export async function getPatientAssignments() {
  return api.get("/api/patient/doctor-assignments");
}

export async function listOwnDiagnoses() {
  return api.get("/api/patient/diagnoses");
}

export async function listPatientIntakeCorrectionRequests() {
  return api.get("/api/patient/intake-correction-requests");
}

export async function createPatientIntakeCorrectionRequest(message) {
  return api.post("/api/patient/intake-correction-requests", { message });
}
