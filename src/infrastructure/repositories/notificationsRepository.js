import api from "@/infrastructure/http/apiClient";

export async function listNotifications() {
  return api.get("/api/notifications");
}

export async function markNotificationRead(notificationId) {
  return api.patch(`/api/notifications/${notificationId}/read`, {});
}

export async function markAllNotificationsRead() {
  return api.patch("/api/notifications/read-all", {});
}
