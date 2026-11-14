import { expect, test } from "@playwright/test";

const token = "doctor-assistance-request-test-token";
const patient = { id: 101, full_name: "Patient A", email: "patient-a@example.test" };
const doctor = { id: 7, full_name: "Dr. Noor", role: "DOCTOR", status: "ACTIVE" };

const reply = (route, data, status = 200) => route.fulfill({
  status,
  json: { success: status < 400, data },
});

async function openDoctorWorkspace(page) {
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
  await page.route(`**/api/doctor/patients/${patient.id}/treatment-plans`, (route) => reply(route, { treatment_plans: [] }));
  await page.goto("/doctor/patients");
  await expect(page.locator("#doctor-assistance-request")).toBeVisible();
}

test("Doctor submits only approved assistance request fields and sees the created request", async ({ page }) => {
  await openDoctorWorkspace(page);
  let submittedPayload;
  let allowCreate;
  let signalCreateStarted;
  const createStarted = new Promise((resolve) => { signalCreateStarted = resolve; });
  const createResponse = new Promise((resolve) => { allowCreate = resolve; });
  await page.route(`**/api/doctor/patients/${patient.id}/assistance-requests`, async (route) => {
    submittedPayload = route.request().postDataJSON();
    signalCreateStarted();
    await createResponse;
    await reply(route, {
      assistance_request: {
        id: 52,
        patient_id: patient.id,
        doctor_id: doctor.id,
        request_type: "Medical supplies",
        description: "Wheelchair needed",
        status: "PENDING",
        ngo_id: null,
      },
    }, 201);
  });

  const section = page.locator("#doctor-assistance-request");
  await section.getByLabel("Request type").fill("  Medical supplies  ");
  await section.getByLabel("Describe the assistance needed").fill("  Wheelchair needed  ");
  await section.getByRole("button", { name: "Submit assistance request" }).click();
  await createStarted;
  await expect(section.getByRole("button", { name: "Submitting..." })).toBeDisabled();
  allowCreate();

  await expect(section.getByRole("status")).toHaveText("The assistance request was submitted successfully.");
  await expect(section).toContainText("Wheelchair needed");
  await expect(section).toContainText("Pending");
  expect(submittedPayload).toEqual({ request_type: "Medical supplies", description: "Wheelchair needed" });
  await expect(section.getByLabel("Request type")).toHaveValue("");
});

test("Doctor form validates required fields and limits request type to 100 characters", async ({ page }) => {
  await openDoctorWorkspace(page);
  const section = page.locator("#doctor-assistance-request");
  await section.getByRole("button", { name: "Submit assistance request" }).click();
  await expect(section.getByText("Enter a request type.")).toBeVisible();
  await expect(section.getByText("Describe the assistance needed.")).toBeVisible();

  await section.getByLabel("Request type").fill("x".repeat(101));
  await section.getByLabel("Describe the assistance needed").fill("Need help");
  await expect(section.getByLabel("Request type")).toHaveValue("x".repeat(100));
});

test("Doctor sees localized field feedback from Backend validation errors", async ({ page }) => {
  await openDoctorWorkspace(page);
  await page.route(`**/api/doctor/patients/${patient.id}/assistance-requests`, (route) => route.fulfill({
    status: 400,
    json: {
      success: false,
      message: "Validation failed",
      errors: {
        request_type: "request_type must not exceed 100 characters",
        description: "description must not be empty",
      },
    },
  }));
  const section = page.locator("#doctor-assistance-request");
  await section.getByLabel("Request type").fill("Supplies");
  await section.getByLabel("Describe the assistance needed").fill("A description");
  await section.getByRole("button", { name: "Submit assistance request" }).click();

  await expect(section.getByRole("alert")).toHaveText("Check the request fields and try again.");
  await expect(section.getByText("Request type must be 100 characters or fewer.")).toBeVisible();
  await expect(section.getByText("Describe the assistance needed.")).toBeVisible();
  await expect(section.getByLabel("Request type")).toHaveValue("Supplies");
});

for (const [name, status, message] of [
  ["inactive or missing assignment", 403, "You need an active assignment to this patient to submit a request."],
  ["missing intake conflict", 409, "A submitted patient health intake is required before requesting assistance."],
  ["server error", 500, "The server could not submit this request. Try again."],
]) {
  test(`Doctor sees recoverable feedback when request is rejected for ${name}`, async ({ page }) => {
    await openDoctorWorkspace(page);
    await page.route(`**/api/doctor/patients/${patient.id}/assistance-requests`, (route) => reply(route, {}, status));
    const section = page.locator("#doctor-assistance-request");
    await section.getByLabel("Request type").fill("Medical supplies");
    await section.getByLabel("Describe the assistance needed").fill("Wheelchair needed");
    await section.getByRole("button", { name: "Submit assistance request" }).click();
    if (status === 403) {
      await expect(page.getByRole("alert")).toContainText("no longer have access");
      await expect(section).toHaveCount(0);
    } else {
      await expect(section.getByRole("alert")).toHaveText(message);
      await expect(section.getByLabel("Request type")).toHaveValue("Medical supplies");
    }
  });
}

test("Doctor sees a safe not-found error when the patient record is missing", async ({ page }) => {
  await openDoctorWorkspace(page);
  await page.route(`**/api/doctor/patients/${patient.id}/assistance-requests`, (route) => reply(route, {}, 404));
  const section = page.locator("#doctor-assistance-request");
  await section.getByLabel("Request type").fill("Medical supplies");
  await section.getByLabel("Describe the assistance needed").fill("Wheelchair needed");
  await section.getByRole("button", { name: "Submit assistance request" }).click();
  await expect(section.getByRole("alert")).toHaveText("The patient or doctor profile could not be found.");
  await expect(section.getByLabel("Request type")).toHaveValue("Medical supplies");
});
