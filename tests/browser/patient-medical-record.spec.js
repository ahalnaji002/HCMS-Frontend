import { expect, test } from "@playwright/test";

const token = "patient-medical-record-browser-test-token";
const patient = { id: 101, full_name: "Lina Patient", role: "PATIENT", status: "ACTIVE" };
const medicalRecord = {
  blood_type: "O+",
  allergies: "Penicillin",
  chronic_diseases: "Asthma",
  medical_history: "Childhood asthma",
  previous_surgeries: "Appendectomy",
};
const dashboard = {
  active_treatment_plans: 0,
  pending_reminders: 0,
  active_emergency_alerts: 0,
  pending_assistance_requests: 0,
  unread_notifications: 0,
};
const profile = {
  full_name: "Lina Patient",
  email: "lina@example.test",
  phone: "0591234567",
  national_id: "123456789",
  date_of_birth: "1998-04-12",
  gender: "FEMALE",
  address: "Nablus",
};
const reply = (route, data, status = 200) => route.fulfill({
  status,
  json: { success: status < 400, data },
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
});

async function setupPatient(page, recordHandler = (route) => reply(route, { medical_record: medicalRecord })) {
  await page.addInitScript((value) => localStorage.setItem("hcms_access_token", value), token);
  await page.route("**/api/auth/me", (route) => reply(route, { user: patient }));
  await page.route("**/api/patient/dashboard", (route) => reply(route, dashboard));
  await page.route("**/api/patient/intake", (route) => reply(route, { intake: null }));
  await page.route("**/api/patient/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/patient/doctor-assignments", (route) => reply(route, { assignments: [] }));
  await page.route("**/api/patient/diagnoses", (route) => reply(route, { diagnoses: [] }));
  await page.route("**/api/patient/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
  await page.route("**/api/profile", (route) => reply(route, { profile }));
  await page.route("**/api/patient/medical-record", recordHandler);
  await page.goto("/patient/medical-record");
}

test("patient sees only their own read-only medical record fields", async ({ page }) => {
  let requestMethod;
  let requestUrl;
  await setupPatient(page, (route) => {
    requestMethod = route.request().method();
    requestUrl = new URL(route.request().url()).pathname;
    return reply(route, { medical_record: medicalRecord });
  });

  const section = page.locator("#patient-medical-record");
  await expect(section.getByRole("heading", { name: "My medical record" })).toBeVisible();
  await expect(page.locator('a[href="/patient/medical-record"][aria-current="page"]')).toHaveCount(1);
  await expect(section.getByText("Loading your medical record...")).toHaveCount(0);
  for (const value of Object.values(medicalRecord)) await expect(section.getByText(value, { exact: true })).toBeVisible();
  await expect(section.getByRole("button")).toHaveCount(1);
  await expect(section.getByRole("button", { name: "Refresh record" })).toBeVisible();
  await expect(section.locator("input, textarea, select, form")).toHaveCount(0);
  expect(requestMethod).toBe("GET");
  expect(requestUrl).toBe("/api/patient/medical-record");
});

test("404 is shown as an absent record without patient write actions", async ({ page }) => {
  await setupPatient(page, (route) => reply(route, {}, 404));
  const section = page.locator("#patient-medical-record");
  await expect(section.getByText("No medical record is available yet.")).toBeVisible();
  await expect(section.getByRole("button", { name: "Check again" })).toBeVisible();
  await expect(section.getByRole("button", { name: /create|edit|delete/i })).toHaveCount(0);
  await expect(section.locator("form, input, textarea, select")).toHaveCount(0);
});

for (const failure of ["403", "500", "network"]) {
  test(`medical record ${failure} failure is explicit and retryable`, async ({ page }) => {
    let failed = true;
    await setupPatient(page, (route) => {
      if (!failed) return reply(route, { medical_record: medicalRecord });
      return failure === "network" ? route.abort("internetdisconnected") : reply(route, {}, Number(failure));
    });
    const section = page.locator("#patient-medical-record");
    const expectedError = failure === "403" ? "You no longer have access"
      : failure === "500" ? "server could not load" : "Unable to connect to the server";
    await expect(section.getByRole("alert")).toContainText(expectedError);
    await expect(section.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(section.getByText("Loading your medical record...")).toHaveCount(0);
    failed = false;
    await section.getByRole("button", { name: "Try again" }).click();
    await expect(section.getByText("Penicillin")).toBeVisible();
  });
}

test("a later 403 clears a previously loaded medical record", async ({ page }) => {
  let deny = false;
  await setupPatient(page, (route) => deny
    ? reply(route, {}, 403)
    : reply(route, { medical_record: medicalRecord }));
  const section = page.locator("#patient-medical-record");
  await expect(section.getByText("Penicillin")).toBeVisible();
  deny = true;
  await section.getByRole("button", { name: "Refresh record" }).click();
  await expect(section.getByRole("alert")).toContainText("You no longer have access");
  await expect(section.getByText("Penicillin")).toHaveCount(0);
});
