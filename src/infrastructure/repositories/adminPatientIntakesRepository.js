import api from "@/infrastructure/http/apiClient";

export async function listJoinRequests() {
  return api.get("/api/admin/join-requests");
}

export async function getJoinRequest(requestId) {
  return api.get(`/api/admin/join-requests/${requestId}`);
}

export async function approveJoinRequest(requestId) {
  return api.patch(`/api/admin/join-requests/${requestId}/approve`, {});
}

export async function rejectJoinRequest(requestId, rejectionReason) {
  return api.patch(`/api/admin/join-requests/${requestId}/reject`, {
    rejection_reason: rejectionReason,
  });
}

export async function listPatientIntakes() {
  return api.get("/api/admin/patient-intakes");
}

export async function listActiveDoctors() {
  return api.get("/api/admin/active-doctors");
}

export async function listAdminEmergencyAlerts() {
  return api.get("/api/admin/emergency-alerts");
}

export async function assignDoctorToEmergencyAlert(alertId, doctorId) {
  return api.patch(`/api/admin/emergency-alerts/${alertId}/assign`, { doctor_id: doctorId });
}

export async function updateDoctorWorkload(doctorId, payload) {
  return api.patch(`/api/admin/doctors/${doctorId}/workload`, payload);
}

export async function startPatientIntakeReview(intakeId) {
  return api.patch(`/api/admin/patient-intakes/${intakeId}/start-review`);
}

export async function assignDoctorToPatient(payload) {
  return api.post("/api/admin/doctor-patient-assignments", payload);
}

export async function listDoctorPatientAssignments() {
  return api.get("/api/admin/doctor-patient-assignments");
}

export async function updateDoctorPatientAssignmentStatus(assignmentId, status) {
  return api.patch(`/api/admin/doctor-patient-assignments/${assignmentId}/status`, { status });
}

export async function listIntakeCorrectionRequests() {
  return api.get("/api/admin/intake-correction-requests");
}

export async function resolveIntakeCorrectionRequest(requestId, adminResponse) {
  return api.patch(`/api/admin/intake-correction-requests/${requestId}/resolve`, {
    admin_response: adminResponse,
  });
}
