import { expect, test } from "@playwright/test";

const token = "doctor-browser-test-token";
const doctor = { id: 7, full_name: "Dr. Noor", role: "DOCTOR", status: "ACTIVE" };
const patients = [
  { id: 101, full_name: "Patient A", email: "patient-a@example.test" },
  { id: 102, full_name: "Patient B", email: "patient-b@example.test" },
];

const reply = (route, data, status = 200) => route.fulfill({
  status,
  json: { success: status < 400, data },
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
});

test("switching patients does not retain data after access to the new patient is denied", async ({ page }) => {
  await page.addInitScript((value) => localStorage.setItem("hcms_access_token", value), token);
  await page.route("**/api/auth/me", (route) => reply(route, { user: doctor }));
  await page.route("**/api/doctor/dashboard", (route) => reply(route, {
    active_patients: 2,
    assigned_emergency_alerts: 0,
    submitted_assistance_requests: 0,
  }));
  await page.route("**/api/doctor/patients", (route) => reply(route, { patients }));
  await page.route("**/api/doctor/patients/101/intake", (route) => reply(route, {
    intake: { current_problem: "Patient A confidential symptom", symptoms: "A symptoms" },
  }));
  await page.route("**/api/doctor/patients/101/medical-notes", (route) => reply(route, {
    medical_notes: [{ id: 1, note: "Patient A confidential note", created_at: "2026-10-26T08:00:00Z" }],
  }));
  await page.route("**/api/doctor/patients/101/diagnoses", (route) => reply(route, {
    diagnoses: [{ id: 1, diagnosis: "Patient A confidential diagnosis", doctor_name: "Dr. Noor", specialization: "General", documented_at: "2026-10-26T08:00:00Z" }],
  }));
  await page.route("**/api/doctor/patients/102/intake", (route) => reply(route, {}, 403));
  await page.route("**/api/doctor/patients/102/medical-notes", (route) => reply(route, { medical_notes: [] }));
  await page.route("**/api/doctor/patients/102/diagnoses", (route) => reply(route, { diagnoses: [] }));

  await page.goto("/doctor");
  await expect(page.getByText("Patient A confidential symptom")).toBeVisible();

  await page.getByRole("button", { name: "Patient B" }).click();
  await expect(page.getByRole("alert")).toContainText("no longer have access");
  await expect(page.getByText("Patient A confidential symptom")).toHaveCount(0);
  await expect(page.getByText("Patient A confidential diagnosis")).toHaveCount(0);
  await expect(page.getByText("Patient A confidential note")).toHaveCount(0);
});
