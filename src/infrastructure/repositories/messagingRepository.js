import api from "@/infrastructure/http/apiClient";

export async function listConversations() {
  return api.get("/api/messages/conversations");
}

export async function getConversationHistory(userId) {
  return api.get(`/api/messages/conversations/${userId}`);
}

export async function sendMessage(payload) {
  return api.post("/api/messages", payload);
}

export async function markMessageRead(messageId) {
  return api.patch(`/api/messages/${messageId}/read`, {});
}
