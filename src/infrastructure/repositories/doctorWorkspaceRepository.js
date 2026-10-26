import api from "@/infrastructure/http/apiClient";

export async function listAssignedPatients() {
  return api.get("/api/doctor/patients");
}

export async function getAssignedPatientIntake(patientId) {
  return api.get(`/api/doctor/patients/${patientId}/intake`);
}

export async function listOwnPatientNotes(patientId) {
  return api.get(`/api/doctor/patients/${patientId}/medical-notes`);
}

export async function listPatientDiagnoses(patientId) {
  return api.get(`/api/doctor/patients/${patientId}/diagnoses`);
}

export async function createPatientDiagnosis(patientId, diagnosis) {
  return api.post(`/api/doctor/patients/${patientId}/diagnoses`, { diagnosis });
}

export async function getPatientMedicalRecord(patientId) {
  return api.get(`/api/doctor/patients/${patientId}/medical-record`);
}

export async function createPatientMedicalRecord(patientId) {
  return api.post(`/api/doctor/patients/${patientId}/medical-record`, {});
}

export async function updatePatientMedicalRecord(patientId, payload) {
  return api.patch(`/api/doctor/patients/${patientId}/medical-record`, payload);
}

export async function createPatientMedicalNote(patientId, payload) {
  return api.post(`/api/doctor/patients/${patientId}/medical-notes`, payload);
}
