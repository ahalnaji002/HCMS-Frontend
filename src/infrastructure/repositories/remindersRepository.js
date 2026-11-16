import api from "@/infrastructure/http/apiClient";

export async function listOwnReminders() {
  return api.get("/api/patient/reminders");
}

export async function createOwnReminder(payload) {
  return api.post("/api/patient/reminders", payload);
}

export async function cancelOwnReminder(reminderId) {
  return api.patch(`/api/patient/reminders/${reminderId}/cancel`, {});
}
