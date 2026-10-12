import api from "@/infrastructure/http/apiClient";

export async function getPatientIntake() {
  return api.get("/api/patient/intake");
}

export async function submitPatientIntake(payload) {
  return api.post("/api/patient/intake", payload);
}

export async function updatePatientIntake(payload) {
  return api.put("/api/patient/intake", payload);
}
