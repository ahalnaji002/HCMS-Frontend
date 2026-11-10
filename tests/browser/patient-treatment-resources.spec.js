import { expect, test } from "@playwright/test";

const token = "patient-treatment-resources-browser-test-token";
const patient = { id: 103, full_name: "Maya Patient", role: "PATIENT", status: "ACTIVE" };
const plan = { id: 702, patient_id: 53, title: "Continuing care" };
const secondPlan = { id: 703, patient_id: 53, title: "Recovery care" };
const medications = [{
  id: 802,
  treatment_plan_id: plan.id,
  medication_name: "Vitamin D",
  dosage: "1000 IU",
  frequency: "Once daily",
  duration: null,
  instructions: "Take after breakfast.",
}];
const appointments = [
  {
    id: 902,
    treatment_plan_id: plan.id,
    appointment_date: "2030-01-02 00:15:00",
    purpose: "Midnight follow-up",
    location: "Clinic B",
    status: "SCHEDULED",
    notes: "Bring the medication list.",
  },
  {
    id: 903,
    treatment_plan_id: plan.id,
    appointment_date: "2020-02-03 09:30:00",
    purpose: "Previous review",
    location: "Clinic B",
    status: "COMPLETED",
    notes: "Completed visit.",
  },
];
const secondMedication = {
  id: 804,
  treatment_plan_id: secondPlan.id,
  medication_name: "Iron supplement",
  dosage: "1 tablet",
  frequency: "Daily",
  duration: "30 days",
  instructions: "Take with water.",
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
  await page.route("**/api/patient/dashboard", (route) => reply(route, {
    active_treatment_plans: 0,
    pending_reminders: 0,
    active_emergency_alerts: 0,
    pending_assistance_requests: 0,
    unread_notifications: 0,
  }));
  await page.route("**/api/patient/intake", (route) => reply(route, { intake: null }));
  await page.route("**/api/patient/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/patient/doctor-assignments", (route) => reply(route, { assignments: [] }));
  await page.route("**/api/patient/diagnoses", (route) => reply(route, { diagnoses: [] }));
  await page.route("**/api/patient/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
  await page.route("**/api/profile", (route) => reply(route, { profile: {
    full_name: patient.full_name,
    email: "maya@example.test",
    phone: "0591234567",
    national_id: "123456789",
    date_of_birth: "1998-04-12",
    gender: "FEMALE",
    address: "Nablus",
  } }));
  await page.route("**/api/patient/medical-record", (route) => reply(route, {}, 404));
  await page.route("**/api/patient/treatment-plans", plansHandler);
}

test("patient sees medication details and appointments grouped without shifting their wall-clock strings", async ({ page }) => {
  await setupPatient(page, (route) => reply(route, { treatment_plans: [plan, secondPlan] }));
  await page.route(`**/api/patient/treatment-plans/${plan.id}/medications`, (route) => reply(route, { medications }));
  await page.route(`**/api/patient/treatment-plans/${plan.id}/appointments`, (route) => reply(route, { appointments }));
  await page.route(`**/api/patient/treatment-plans/${secondPlan.id}/medications`, (route) => reply(route, { medications: [secondMedication] }));
  await page.route(`**/api/patient/treatment-plans/${secondPlan.id}/appointments`, (route) => reply(route, { appointments: [] }));
  await page.goto("/patient/medications-appointments");

  const section = page.locator("#patient-medications-appointments");
  await expect(page.locator('a[href="/patient/medications-appointments"][aria-current="page"]')).toHaveCount(1);
  await expect(section.getByRole("heading", { name: "Medications and appointments" })).toBeVisible();
  await expect(section.getByText("Vitamin D")).toBeVisible();
  await expect(section.getByText("Take after breakfast.")).toBeVisible();
  await expect(section.getByText("Iron supplement")).toBeVisible();
  await expect(section.getByText("Recovery care")).toBeVisible();
  await expect(section.getByText("Continuing care").first()).toBeVisible();
  await expect(section.getByRole("heading", { name: "Upcoming" })).toBeVisible();
  await expect(section.getByText("Midnight follow-up")).toBeVisible();
  await expect(section.getByText("2030-01-02 00:15:00", { exact: true })).toBeVisible();
  await expect(section.getByRole("heading", { name: "Past" })).toBeVisible();
  await expect(section.getByText("Previous review")).toBeVisible();
  await expect(section.getByText("2020-02-03 09:30:00", { exact: true })).toBeVisible();
  await expect(section.locator("form, input, textarea, select")).toHaveCount(0);
});

test("patient sees empty states when no plans or related resources exist", async ({ page }) => {
  await setupPatient(page, (route) => reply(route, { treatment_plans: [] }));
  await page.goto("/patient/medications-appointments");
  const section = page.locator("#patient-medications-appointments");
  await expect(section.getByText("No medications are linked to your treatment plans yet.")).toBeVisible();
  await expect(section.getByText("You have no upcoming appointments.")).toBeVisible();
  await expect(section.getByText("You have no past appointments.")).toBeVisible();
});

test("patient receives a loading state and can retry an API error", async ({ page }) => {
  let fail = true;
  // Hold the first response until the loading state has been observed, so the
  // assertion does not depend on machine speed.
  let releaseFirstResponse;
  const firstResponseReleased = new Promise((resolve) => { releaseFirstResponse = resolve; });
  await setupPatient(page);
  await page.route(`**/api/patient/treatment-plans/${plan.id}/medications`, async (route) => {
    if (fail) {
      await firstResponseReleased;
      return reply(route, {}, 500);
    }
    return reply(route, { medications });
  });
  await page.route(`**/api/patient/treatment-plans/${plan.id}/appointments`, (route) => reply(route, { appointments }));
  await page.goto("/patient/medications-appointments");
  const section = page.locator("#patient-medications-appointments");
  await expect(section.getByRole("status")).toContainText("Loading your medications and appointments");
  releaseFirstResponse();
  await expect(section.getByRole("alert")).toContainText("server could not load");
  fail = false;
  await section.getByRole("button", { name: "Try again" }).click();
  await expect(section.getByText("Vitamin D")).toBeVisible();
});
