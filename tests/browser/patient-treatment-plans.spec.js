import { expect, test } from "@playwright/test";

const token = "patient-treatment-plans-browser-test-token";
const patient = { id: 102, full_name: "Lina Patient", role: "PATIENT", status: "ACTIVE" };
const plan = {
  id: 701,
  patient_id: 52,
  doctor_id: 18,
  title: "Recovery plan",
  general_instructions: "Take medication with food.",
  status: "ACTIVE",
  start_date: "2026-10-01",
  end_date: null,
};
const medications = [{
  id: 801,
  treatment_plan_id: plan.id,
  medication_name: "Amoxicillin",
  dosage: "500 mg",
  frequency: "Twice daily",
  duration: "7 days",
  instructions: "Take with food.",
}];
const appointments = [{
  id: 901,
  treatment_plan_id: plan.id,
  appointment_date: "2026-11-20 14:30:00",
  purpose: "Follow-up visit",
  location: "Clinic A",
  status: "SCHEDULED",
  notes: "Bring previous reports.",
}];
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

async function setupPatient(page, plansHandler = (route) => reply(route, { treatment_plans: [plan] })) {
  await page.addInitScript((value) => localStorage.setItem("hcms_access_token", value), token);
  await page.route("**/api/auth/me", (route) => reply(route, { user: patient }));
  await page.route("**/api/patient/dashboard", (route) => reply(route, dashboard));
  await page.route("**/api/patient/intake", (route) => reply(route, { intake: null }));
  await page.route("**/api/patient/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/patient/doctor-assignments", (route) => reply(route, { assignments: [] }));
  await page.route("**/api/patient/diagnoses", (route) => reply(route, { diagnoses: [] }));
  await page.route("**/api/patient/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
  await page.route("**/api/profile", (route) => reply(route, { profile }));
  await page.route("**/api/patient/medical-record", (route) => reply(route, {}, 404));
  await page.route("**/api/patient/treatment-plans", plansHandler);
  await page.goto("/patient");
}

test("patient can review an own plan and follow its medication and appointment relationships", async ({ page }) => {
  let listMethod;
  let detailPath;
  await setupPatient(page, (route) => {
    listMethod = route.request().method();
    return reply(route, { treatment_plans: [plan] });
  });
  await page.route(`**/api/patient/treatment-plans/${plan.id}`, (route) => {
    detailPath = new URL(route.request().url()).pathname;
    return reply(route, { treatment_plan: plan });
  });
  const section = page.locator("#patient-treatment-plans");
  await expect(page.locator('a[href="/patient#patient-treatment-plans"]')).toHaveCount(1);
  await expect(section.getByRole("heading", { name: "My treatment plans" })).toBeVisible();
  await expect(section.getByRole("button", { name: /Recovery plan/ })).toBeVisible();
  await section.getByRole("button", { name: /Recovery plan/ }).click();
  await expect(section.getByText("Take medication with food.")).toBeVisible();
  await expect(section.getByRole("definition").filter({ hasText: "2026-10-01 – No end date" })).toBeVisible();
  expect(listMethod).toBe("GET");
  expect(detailPath).toBe(`/api/patient/treatment-plans/${plan.id}`);

  let medicationPath;
  await page.route(`**/api/patient/treatment-plans/${plan.id}/medications`, (route) => {
    medicationPath = new URL(route.request().url()).pathname;
    return reply(route, { medications });
  });
  await section.getByRole("button", { name: "View medications" }).click();
  await expect(section.getByText("Amoxicillin")).toBeVisible();
  expect(medicationPath).toBe(`/api/patient/treatment-plans/${plan.id}/medications`);

  let appointmentPath;
  await page.route(`**/api/patient/treatment-plans/${plan.id}/appointments`, (route) => {
    appointmentPath = new URL(route.request().url()).pathname;
    return reply(route, { appointments });
  });
  await section.getByRole("button", { name: "View appointments" }).click();
  await expect(section.getByText("Follow-up visit")).toBeVisible();
  await expect(section.getByText("2026-11-20 14:30:00")).toBeVisible();
  expect(appointmentPath).toBe(`/api/patient/treatment-plans/${plan.id}/appointments`);
  await expect(section.locator("form, input, textarea, select")).toHaveCount(0);
});

test("patient sees an empty state when no treatment plans are returned", async ({ page }) => {
  await setupPatient(page, (route) => reply(route, { treatment_plans: [] }));
  const section = page.locator("#patient-treatment-plans");
  await expect(section.getByText("You do not have any treatment plans yet.")).toBeVisible();
  await expect(section.getByRole("button", { name: /Recovery plan/ })).toHaveCount(0);
});

for (const failure of ["403", "500", "network"]) {
  test(`treatment-plan list ${failure} failure is clear and retryable`, async ({ page }) => {
    let failed = true;
    await setupPatient(page, (route) => {
      if (!failed) return reply(route, { treatment_plans: [plan] });
      return failure === "network" ? route.abort("internetdisconnected") : reply(route, {}, Number(failure));
    });
    const section = page.locator("#patient-treatment-plans");
    const expectedError = failure === "403" ? "no longer have access"
      : failure === "500" ? "server could not load" : "Unable to connect to the server";
    await expect(section.getByRole("alert")).toContainText(expectedError);
    await expect(section.getByText("Loading your treatment plans...")).toHaveCount(0);
    failed = false;
    await section.getByRole("button", { name: "Try again" }).click();
    await expect(section.getByRole("button", { name: /Recovery plan/ })).toBeVisible();
  });
}

test("a missing plan detail does not leave stale detail visible", async ({ page }) => {
  await setupPatient(page);
  await page.route(`**/api/patient/treatment-plans/${plan.id}`, (route) => reply(route, {}, 404));
  const section = page.locator("#patient-treatment-plans");
  await section.getByRole("button", { name: /Recovery plan/ }).click();
  await expect(section.getByRole("alert")).toContainText("could not be found");
  await expect(section.getByText("Take medication with food.")).toHaveCount(0);
  await expect(section.getByRole("button", { name: /Recovery plan/ })).toBeVisible();
});

test("a 403 while opening a plan clears the patient plan list", async ({ page }) => {
  await setupPatient(page);
  await page.route(`**/api/patient/treatment-plans/${plan.id}`, (route) => reply(route, {}, 403));
  const section = page.locator("#patient-treatment-plans");
  await section.getByRole("button", { name: /Recovery plan/ }).click();
  await expect(section.getByRole("alert")).toContainText("no longer have access");
  await expect(section.getByRole("button", { name: /Recovery plan/ })).toHaveCount(0);
});

for (const failure of ["403", "500", "network"]) {
  test(`linked treatment medication ${failure} failure is retryable`, async ({ page }) => {
    let failed = true;
    await setupPatient(page);
    await page.route(`**/api/patient/treatment-plans/${plan.id}`, (route) => reply(route, { treatment_plan: plan }));
    await page.route(`**/api/patient/treatment-plans/${plan.id}/medications`, (route) => {
      if (!failed) return reply(route, { medications });
      return failure === "network" ? route.abort("internetdisconnected") : reply(route, {}, Number(failure));
    });
    const section = page.locator("#patient-treatment-plans");
    await section.getByRole("button", { name: /Recovery plan/ }).click();
    await section.getByRole("button", { name: "View medications" }).click();
    const expectedError = failure === "403" ? "no longer have access"
      : failure === "500" ? "server could not load" : "Unable to connect to the server";
    await expect(section.getByRole("alert")).toContainText(expectedError);
    if (failure === "403") {
      await expect(section.getByRole("button", { name: /Recovery plan/ })).toHaveCount(0);
      await expect(section.getByRole("button", { name: "View medications" })).toHaveCount(0);
      return;
    }
    failed = false;
    await section.getByRole("button", { name: "Try again" }).last().click();
    await expect(section.getByText("Amoxicillin", { exact: true })).toBeVisible();
  });
}
