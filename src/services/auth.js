import api from "./api";

export async function login(credentials) {
  const response = await api.post("/api/auth/login", credentials, {
    skipAuth: true,
  });

  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get("/api/auth/me");

  return response.data;
}

export async function registerPatient(patientData) {
  const response = await api.post(
    "/api/auth/register/patient",
    patientData,
    {
      skipAuth: true,
    },
  );

  return response.data;
}