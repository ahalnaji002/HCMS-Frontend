import api from "@/infrastructure/http/apiClient";

export function listAssistanceRequests() {
  return api.get("/api/ngo/assistance-requests");
}

export function getAssistanceRequest(requestId) {
  return api.get(`/api/ngo/assistance-requests/${requestId}`);
}
