import api from "@/infrastructure/http/apiClient";

const dashboardEndpoints = {
  PATIENT: "/api/patient/dashboard",
  DOCTOR: "/api/doctor/dashboard",
  NGO: "/api/ngo/dashboard",
  ADMIN: "/api/admin/dashboard",
};

export function getRoleDashboard(role) {
  const endpoint = dashboardEndpoints[role];

  if (!endpoint) {
    throw new Error(`Unsupported dashboard role: ${role}`);
  }

  return api.get(endpoint);
}
