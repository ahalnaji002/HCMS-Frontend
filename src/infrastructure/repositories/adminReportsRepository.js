import api from "@/infrastructure/http/apiClient";

export async function getPatientReport(params) {
  return api.get("/api/admin/reports/patients", { params });
}

export async function getTreatmentPlanReport(params) {
  return api.get("/api/admin/reports/treatment-plans", { params });
}

export async function getAssistanceRequestReport(params) {
  return api.get("/api/admin/reports/assistance-requests", { params });
}
