import api from "@/infrastructure/http/apiClient";

// Visitor emergency alert (FR-6.1). Public and rate limited per IP on the backend.
export async function createPublicEmergencyAlert(payload) {
  return api.post("/api/emergency-alerts", payload);
}
