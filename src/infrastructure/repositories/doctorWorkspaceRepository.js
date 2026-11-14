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

export async function createPatientAssistanceRequest(patientId, payload) {
  return api.post(`/api/doctor/patients/${patientId}/assistance-requests`, payload);
}

export async function listPatientTreatmentPlans(patientId) {
  return api.get(`/api/doctor/patients/${patientId}/treatment-plans`);
}

export async function getPatientTreatmentPlan(patientId, planId) {
  return api.get(`/api/doctor/patients/${patientId}/treatment-plans/${planId}`);
}

export async function createPatientTreatmentPlan(patientId, payload) {
  return api.post(`/api/doctor/patients/${patientId}/treatment-plans`, payload);
}

export async function updatePatientTreatmentPlan(patientId, planId, payload) {
  return api.patch(`/api/doctor/patients/${patientId}/treatment-plans/${planId}`, payload);
}

export async function listTreatmentPlanMedications(planId) {
  return api.get(`/api/doctor/treatment-plans/${planId}/medications`);
}

export async function getTreatmentPlanMedication(planId, medicationId) {
  return api.get(`/api/doctor/treatment-plans/${planId}/medications/${medicationId}`);
}

export async function createTreatmentPlanMedication(planId, payload) {
  return api.post(`/api/doctor/treatment-plans/${planId}/medications`, payload);
}

export async function updateTreatmentPlanMedication(planId, medicationId, payload) {
  return api.patch(`/api/doctor/treatment-plans/${planId}/medications/${medicationId}`, payload);
}

export async function deleteTreatmentPlanMedication(planId, medicationId) {
  return api.delete(`/api/doctor/treatment-plans/${planId}/medications/${medicationId}`);
}

export async function listTreatmentPlanAppointments(planId) {
  return api.get(`/api/doctor/treatment-plans/${planId}/appointments`);
}

export async function getTreatmentPlanAppointment(planId, appointmentId) {
  return api.get(`/api/doctor/treatment-plans/${planId}/appointments/${appointmentId}`);
}

export async function createTreatmentPlanAppointment(planId, payload) {
  return api.post(`/api/doctor/treatment-plans/${planId}/appointments`, payload);
}

export async function updateTreatmentPlanAppointment(planId, appointmentId, payload) {
  return api.patch(`/api/doctor/treatment-plans/${planId}/appointments/${appointmentId}`, payload);
}

export async function deleteTreatmentPlanAppointment(planId, appointmentId) {
  return api.delete(`/api/doctor/treatment-plans/${planId}/appointments/${appointmentId}`);
}
