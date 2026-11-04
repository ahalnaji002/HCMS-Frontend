import { expect, test } from "@playwright/test";

const token = "patient-profile-browser-test-token";
const patient = { id: 88, full_name: "Lina Patient", role: "PATIENT", status: "ACTIVE" };
const profile = {
  full_name: "Lina Patient",
  email: "lina@example.test",
  phone: "0591234567",
  national_id: "123456789",
  date_of_birth: "1998-04-12",
  gender: "FEMALE",
  address: "Nablus",
};
const dashboard = {
  active_treatment_plans: 0,
  pending_reminders: 0,
  active_emergency_alerts: 0,
  pending_assistance_requests: 0,
  unread_notifications: 0,
};
const reply = (route, data, status = 200) => route.fulfill({
  status,
  json: { success: status < 400, data },
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
});

async function setupPatient(page, intakeStatus = null) {
  await page.addInitScript((value) => localStorage.setItem("hcms_access_token", value), token);
  await page.route("**/api/auth/me", (route) => reply(route, { user: patient }));
  await page.route("**/api/patient/dashboard", (route) => reply(route, dashboard));
  await page.route("**/api/patient/intake", (route) => reply(route, {
    intake: intakeStatus ? { status: intakeStatus } : null,
  }));
  await page.route("**/api/patient/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/patient/doctor-assignments", (route) => reply(route, { assignments: [] }));
  await page.route("**/api/patient/diagnoses", (route) => reply(route, { diagnoses: [] }));
  await page.route("**/api/patient/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
  await page.route("**/api/profile", (route) => reply(route, { profile }));
  await page.goto("/patient");
}

test("patient can edit approved fields while email and National ID stay read-only", async ({ page }) => {
  await setupPatient(page);
  let savedPayload;
  await page.route("**/api/profile", (route) => {
    if (route.request().method() === "PATCH") {
      savedPayload = route.request().postDataJSON();
      return reply(route, { profile: { ...profile, ...savedPayload } });
    }
    return reply(route, { profile });
  });
  const section = page.locator("#patient-profile");
  await expect(section.getByText("123456789")).toBeVisible();
  await expect(section.getByText("lina@example.test")).toBeVisible();
  await section.getByRole("button", { name: "Edit profile" }).click();
  await section.getByLabel("Full name").fill("Lina Updated");
  await section.getByLabel("Phone number").fill("0561234567");
  await section.getByLabel("Date of birth").fill("1998-04-13");
  await section.getByLabel("Address").fill("Ramallah");
  await section.getByRole("button", { name: "Save profile" }).click();
  await expect(section.getByRole("status")).toContainText("profile was updated");
  expect(savedPayload).toEqual({
    full_name: "Lina Updated",
    phone: "0561234567",
    date_of_birth: "1998-04-13",
    gender: "FEMALE",
    address: "Ramallah",
  });
  expect(savedPayload).not.toHaveProperty("email");
  expect(savedPayload).not.toHaveProperty("national_id");
});

test("profile validates editable fields before sending a PATCH", async ({ page }) => {
  let patchCount = 0;
  await setupPatient(page);
  await page.route("**/api/profile", async (route) => {
    if (route.request().method() === "PATCH") patchCount += 1;
    await reply(route, { profile });
  });
  const section = page.locator("#patient-profile");
  await section.getByRole("button", { name: "Edit profile" }).click();
  await section.getByLabel("Full name").fill("  ");
  await section.getByLabel("Phone number").fill("123");
  await section.getByLabel("Date of birth").fill("2099-01-01");
  await section.getByLabel("Gender").selectOption("");
  await section.getByLabel("Address").fill("x".repeat(256));
  await section.getByRole("button", { name: "Save profile" }).click();
  await expect(section.getByText("Enter your full name.")).toBeVisible();
  await expect(section.getByText(/10-digit phone number/)).toBeVisible();
  await expect(section.getByText("Date of birth cannot be in the future.")).toBeVisible();
  await expect(section.getByText("Select Male or Female.")).toBeVisible();
  await expect(section.getByText("Address must be 255 characters or fewer.")).toBeVisible();
  expect(patchCount).toBe(0);
});

test("profile maps backend validation errors to the corresponding field", async ({ page }) => {
  await setupPatient(page);
  await page.route("**/api/profile", (route) => route.request().method() === "PATCH"
    ? route.fulfill({ status: 400, json: { success: false, message: "Validation failed", errors: { phone: ["Invalid phone"] } } })
    : reply(route, { profile }));
  const section = page.locator("#patient-profile");
  await section.getByRole("button", { name: "Edit profile" }).click();
  await section.getByLabel("Phone number").fill("0597654321");
  await section.getByRole("button", { name: "Save profile" }).click();
  await expect(section.getByLabel("Phone number")).toHaveAttribute("aria-invalid", "true");
  await expect(section.getByText("This field was rejected by the server. Review it and try again.")).toBeVisible();
});

for (const failure of ["403", "500", "network"]) {
  test(`profile GET ${failure} shows a settled error and retry recovers`, async ({ page }) => {
    let failed = true;
    await setupPatient(page);
    await page.route("**/api/profile", (route) => {
      if (!failed) return reply(route, { profile });
      return failure === "network" ? route.abort("internetdisconnected") : reply(route, {}, Number(failure));
    });
    await page.reload();
    const section = page.locator("#patient-profile");
    await expect(section.getByRole("alert")).toBeVisible();
    await expect(section.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(section.getByText("Loading profile details...")).toHaveCount(0);
    failed = false;
    await section.getByRole("button", { name: "Try again" }).click();
    await expect(section.getByText("Lina Patient")).toBeVisible();
  });
}

for (const resource of [
  { name: "emergency alerts", path: "**/api/patient/emergency-alerts", errorText: "Could not load emergency alerts.", section: "#emergency-alerts", heading: "My recent alerts" },
  { name: "doctor assignments", path: "**/api/patient/doctor-assignments", errorText: "Could not load your doctor assignments.", section: null, heading: "Doctors assigned to your care" },
  { name: "diagnoses", path: "**/api/patient/diagnoses", errorText: "Could not load your diagnoses.", section: null, heading: "Doctors’ diagnoses" },
]) {
  for (const failure of ["403", "500", "network"]) {
    test(`${resource.name} ${failure} failure is explicit and retryable`, async ({ page }) => {
      let failed = true;
      await setupPatient(page, "DOCTOR_ASSIGNED");
      await page.route(resource.path, (route) => {
        if (!failed) return reply(route, resource.path.includes("diagnoses") ? { diagnoses: [] } : resource.path.includes("doctor-assignments") ? { assignments: [] } : { emergency_alerts: [] });
        return failure === "network" ? route.abort("internetdisconnected") : reply(route, {}, Number(failure));
      });
      await page.reload();
      const section = resource.section
        ? page.locator(resource.section)
        : page.getByRole("heading", { name: resource.heading }).locator("..");
      const expectedError = failure === "403" ? "no longer have access"
        : failure === "500" ? "server could not load" : "Unable to connect to the server";
      await expect(section.getByRole("alert")).toContainText(expectedError);
      await expect(section.getByRole("button", { name: "Try again" })).toBeVisible();
      if (resource.name === "emergency alerts") {
        await expect(section.getByText("You have no emergency alerts yet.")).toHaveCount(0);
      }
      failed = false;
      await section.getByRole("button", { name: "Try again" }).click();
      await expect(section.getByRole("alert")).toHaveCount(0);
    });
  }
}

test("profile access loss after loading clears the previously visible profile", async ({ page }) => {
  let patchFailed = true;
  await setupPatient(page);
  await page.route("**/api/profile", (route) => {
    if (route.request().method() === "PATCH" && patchFailed) return reply(route, {}, 403);
    if (route.request().method() === "PATCH") return reply(route, { profile: { ...profile, full_name: "Updated" } });
    return reply(route, { profile });
  });
  const section = page.locator("#patient-profile");
  await expect(section.getByText("123456789")).toBeVisible();
  await section.getByRole("button", { name: "Edit profile" }).click();
  await section.getByLabel("Full name").fill("Should not remain visible");
  await section.getByRole("button", { name: "Save profile" }).click();
  await expect(section.getByRole("alert")).toContainText("no longer have access");
  await expect(section.getByText("123456789")).toHaveCount(0);
  await expect(section.getByText("Should not remain visible")).toHaveCount(0);
});
