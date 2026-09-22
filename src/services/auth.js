import API from "./api";

export async function registerPatient(patientData) {
  const response = await API.post(
    "/api/auth/register/patient",
    patientData
  );

  return response.data;
}