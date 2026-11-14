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

export function createResourceAllocation(requestId, allocation) {
  return api.post(`/api/ngo/assistance-requests/${requestId}/resources`, allocation);
}

export function updateResourceAllocation(requestId, resourceId, allocation) {
  return api.patch(`/api/ngo/assistance-requests/${requestId}/resources/${resourceId}`, allocation);
}

export function deleteResourceAllocation(requestId, resourceId) {
  return api.delete(`/api/ngo/assistance-requests/${requestId}/resources/${resourceId}`);
}
