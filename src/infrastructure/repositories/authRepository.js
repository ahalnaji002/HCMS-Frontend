import api from "@/infrastructure/http/apiClient";

export async function login(credentials) {
  return api.post("/api/auth/login", credentials, {
    skipAuth: true,
  });
}

export async function getCurrentUser() {
  return api.get("/api/auth/me");
}

export async function registerPatient(patientData) {
  return api.post(
    "/api/auth/register/patient",
    patientData,
    {
      skipAuth: true,
    },
  );
}

export async function registerDoctor(doctorData) {
  return api.post("/api/auth/register/doctor", doctorData, {
    skipAuth: true,
  });

}

export async function registerNgo(ngoData) {
  return api.post("/api/auth/register/ngo", ngoData, {
    skipAuth: true,
  });

}
