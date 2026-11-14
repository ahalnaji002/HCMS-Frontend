import api from "@/infrastructure/http/apiClient";

export function listAssistanceRequests() {
  return api.get("/api/ngo/assistance-requests");
}

export function getAssistanceRequest(requestId) {
  return api.get(`/api/ngo/assistance-requests/${requestId}`);
}

export function listAssistanceRequestResources(requestId) {
  return api.get(`/api/ngo/assistance-requests/${requestId}/resources`);
}

export function updateAssistanceRequestStatus(requestId, status) {
  return api.patch(`/api/ngo/assistance-requests/${requestId}/status`, { status });
}
