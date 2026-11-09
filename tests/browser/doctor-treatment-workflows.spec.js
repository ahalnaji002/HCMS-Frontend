import { expect, test } from "@playwright/test";

const token = "doctor-treatment-workflow-test-token";
const doctor = { id: 18, full_name: "Dr. Noor", role: "DOCTOR", status: "ACTIVE" };
const patient = { id: 101, full_name: "Lina Patient", email: "lina@example.test" };
const plan = {
  id: 501,
  patient_id: patient.id,
  doctor_id: doctor.id,
  title: "Recovery plan",
  general_instructions: "Rest and stay hydrated.",
  status: "ACTIVE",
  start_date: "2026-12-01",
  end_date: null,
};
const medication = {
  id: 601,
  treatment_plan_id: plan.id,
  medication_name: "Vitamin D",
  dosage: "1000 IU",
  frequency: "Once daily",
  instructions: "Take after breakfast.",
};
const appointment = {
  id: 701,
  treatment_plan_id: plan.id,
  appointment_date: "2026-12-05 09:15:00",
  purpose: "Follow-up",
  status: "SCHEDULED",
  location: "Clinic A",
};
const reply = (route, data, status = 200) => route.fulfill({
  status,
  json: { success: status < 400, data },
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
});

async function setupDoctor(page) {
  await page.addInitScript((value) => localStorage.setItem("hcms_access_token", value), token);
  await page.route("**/api/auth/me", (route) => reply(route, { user: doctor }));
  await page.route("**/api/doctor/dashboard", (route) => reply(route, {
    active_patients: 1,
    assigned_emergency_alerts: 0,
    submitted_assistance_requests: 0,
  }));
  await page.route("**/api/doctor/patients", (route) => reply(route, { patients: [patient] }));
  await page.route(`**/api/doctor/patients/${patient.id}/intake`, (route) => reply(route, { intake: null }));
  await page.route(`**/api/doctor/patients/${patient.id}/medical-notes`, (route) => reply(route, { medical_notes: [] }));
  await page.route(`**/api/doctor/patients/${patient.id}/diagnoses`, (route) => reply(route, { diagnoses: [] }));
  await page.route(`**/api/doctor/patients/${patient.id}/medical-record`, (route) => reply(route, {}, 404));
}

test("assigned Doctor creates a treatment plan, medication, and appointment and sees refreshed data", async ({ page }) => {
  let planListCalls = 0;
  let medicationListCalls = 0;
  let appointmentListCalls = 0;
  let planCreated = false;
  let medicationCreated = false;
  let appointmentCreated = false;
  let planPayload;
  let medicationPayload;
  let appointmentPayload;

  await setupDoctor(page);
  await page.route(`**/api/doctor/patients/${patient.id}/treatment-plans`, async (route) => {
    if (route.request().method() === "GET") {
      planListCalls += 1;
      return reply(route, { treatment_plans: planCreated ? [plan] : [] });
    }
    planPayload = route.request().postDataJSON();
    planCreated = true;
    return reply(route, { treatment_plan: plan }, 201);
  });
  await page.route(`**/api/doctor/patients/${patient.id}/treatment-plans/${plan.id}`, (route) => reply(route, { treatment_plan: plan }));
  await page.route(`**/api/doctor/treatment-plans/${plan.id}/medications`, async (route) => {
    if (route.request().method() === "GET") {
      medicationListCalls += 1;
      return reply(route, { medications: medicationCreated ? [medication] : [] });
    }
    medicationPayload = route.request().postDataJSON();
    medicationCreated = true;
    return reply(route, { medication }, 201);
  });
  await page.route(`**/api/doctor/treatment-plans/${plan.id}/appointments`, async (route) => {
    if (route.request().method() === "GET") {
      appointmentListCalls += 1;
      return reply(route, { appointments: appointmentCreated ? [appointment] : [] });
    }
    appointmentPayload = route.request().postDataJSON();
    appointmentCreated = true;
    return reply(route, { appointment }, 201);
  });

  await page.goto("/doctor");
  await expect(page.locator('a[href="/doctor#doctor-treatment-plans"]')).toHaveCount(3);
  const plans = page.locator("#doctor-treatment-plans");
  await expect(plans.getByText("This patient has no treatment plans yet.")).toBeVisible();
  await plans.getByRole("button", { name: "Create treatment plan" }).click();
  await plans.getByLabel("Plan title").fill("Recovery plan");
  await plans.getByLabel("Start date").fill("2026-12-01");
  await plans.getByLabel("General instructions").fill("Rest and stay hydrated.");
  await plans.getByRole("button", { name: "Create treatment plan" }).last().click();

  await expect(plans.getByText("Treatment plan created.")).toBeVisible();
  await expect(plans.getByRole("button", { name: /Recovery plan/ })).toBeVisible();
  await expect(plans.getByText("No medications have been added to this plan.")).toBeVisible();
  expect(planListCalls).toBeGreaterThanOrEqual(2);
  expect(planPayload).toEqual({ title: "Recovery plan", start_date: "2026-12-01", general_instructions: "Rest and stay hydrated." });

  const resources = plans.getByRole("region", { name: "Plan medications and appointments" });
  await resources.getByRole("button", { name: "Add medication" }).click();
  await resources.getByLabel("Medication name").fill("Vitamin D");
  await resources.getByLabel("Dosage").fill("1000 IU");
  await resources.getByLabel("Frequency").fill("Once daily");
  await resources.getByLabel("Instructions").fill("Take after breakfast.");
  await resources.getByRole("button", { name: "Save medication" }).click();
  await expect(resources.getByText("Medication added.")).toBeVisible();
  await expect(resources.getByText("Vitamin D")).toBeVisible();
  expect(medicationListCalls).toBeGreaterThanOrEqual(2);
  expect(medicationPayload).toEqual({ medication_name: "Vitamin D", dosage: "1000 IU", frequency: "Once daily", instructions: "Take after breakfast." });

  await resources.getByRole("button", { name: "Add appointment" }).click();
  await resources.getByLabel("Date and time (Palestine local time)").fill("2026-12-05T09:15");
  await resources.getByLabel("Purpose").fill("Follow-up");
  await resources.getByLabel("Location").fill("Clinic A");
  await resources.getByRole("button", { name: "Save appointment" }).click();
  await expect(resources.getByText("Appointment added.")).toBeVisible();
  await expect(resources.getByText("2026-12-05 09:15:00")).toBeVisible();
  expect(appointmentListCalls).toBeGreaterThanOrEqual(2);
  expect(appointmentPayload).toEqual({ appointment_date: "2026-12-05 09:15:00", purpose: "Follow-up", location: "Clinic A" });
  await expect(resources.locator("form")).toHaveCount(0);
  await expect(page.locator("body")).toContainText("Patient's health report");
});

test("Doctor keeps the plan draft and shows backend validation feedback", async ({ page }) => {
  await setupDoctor(page);
  await page.route(`**/api/doctor/patients/${patient.id}/treatment-plans`, (route) => {
    if (route.request().method() === "GET") return reply(route, { treatment_plans: [] });
    return route.fulfill({ status: 400, json: { success: false, message: "Validation failed", errors: { title: ["Required"] } } });
  });
  await page.goto("/doctor");
  const plans = page.locator("#doctor-treatment-plans");
  await plans.getByRole("button", { name: "Create treatment plan" }).click();
  await plans.getByLabel("Plan title").fill("Draft plan");
  await plans.getByLabel("Start date").fill("2026-12-01");
  await plans.getByRole("button", { name: "Create treatment plan" }).last().click();
  await expect(plans.getByRole("alert")).toContainText("Check the plan fields and try again.");
  await expect(plans.getByLabel("Plan title")).toHaveValue("Draft plan");
  await expect(plans.locator("form")).toBeVisible();
});

test("Doctor plan management clears plan details when assignment access is lost", async ({ page }) => {
  await setupDoctor(page);
  await page.route(`**/api/doctor/patients/${patient.id}/treatment-plans`, (route) => {
    if (route.request().method() === "GET") return reply(route, { treatment_plans: [] });
    return reply(route, {}, 403);
  });
  await page.goto("/doctor");
  const plans = page.locator("#doctor-treatment-plans");
  await plans.getByRole("button", { name: "Create treatment plan" }).click();
  await plans.getByLabel("Plan title").fill("Unassigned plan");
  await plans.getByLabel("Start date").fill("2026-12-01");
  await plans.getByRole("button", { name: "Create treatment plan" }).last().click();
  await expect(plans.getByRole("alert")).toContainText("You no longer have access to this patient's treatment plans.");
  await expect(plans.getByLabel("Plan title")).toHaveCount(0);
  await expect(plans.getByText("This patient has no treatment plans yet.")).toBeVisible();
});
