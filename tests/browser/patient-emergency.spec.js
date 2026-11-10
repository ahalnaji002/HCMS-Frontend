import { expect, test } from "@playwright/test";

const token = "patient-emergency-browser-test-token";
const patient = { id: 91, full_name: "Omar Patient", role: "PATIENT", status: "ACTIVE" };
const profile = {
  full_name: "Omar Patient",
  email: "omar@example.test",
  phone: "0599876543",
  national_id: "223456789",
  date_of_birth: "1990-02-01",
  gender: "MALE",
  address: "Gaza",
};
const dashboard = {
  active_treatment_plans: 0,
  pending_reminders: 0,
  active_emergency_alerts: 0,
  pending_assistance_requests: 0,
  unread_notifications: 0,
};
const reply = (route, data, status = 200) => route.fulfill({ status, json: { success: status < 400, data } });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
});

async function setupPatient(page, onCreateAlert) {
  await page.addInitScript((value) => localStorage.setItem("hcms_access_token", value), token);
  await page.route("**/api/auth/me", (route) => reply(route, { user: patient }));
  await page.route("**/api/patient/dashboard", (route) => reply(route, dashboard));
  await page.route("**/api/patient/intake", (route) => reply(route, { intake: null }));
  await page.route("**/api/patient/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/patient/doctor-assignments", (route) => reply(route, { assignments: [] }));
  await page.route("**/api/patient/diagnoses", (route) => reply(route, { diagnoses: [] }));
  await page.route("**/api/profile", (route) => reply(route, { profile }));
  await page.route("**/api/patient/emergency-alerts", (route) => (
    route.request().method() === "POST" ? onCreateAlert(route) : reply(route, { emergency_alerts: [] })
  ));
  await page.goto("/patient");
}

test("floating emergency button is visible at the top of the page and pre-fills the profile phone", async ({ page }) => {
  let payload;
  await setupPatient(page, (route) => {
    payload = route.request().postDataJSON();
    return reply(route, { emergency_alert: { id: 501, status: "PENDING_ASSIGNMENT", sent_at: "2026-11-10T10:00:00Z" } }, 201);
  });

  const emergencyButton = page.getByRole("button", { name: "Send an emergency alert" }).last();
  await expect(emergencyButton).toBeInViewport();
  await emergencyButton.click();

  const dialog = page.getByRole("dialog", { name: "Send an emergency alert" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Contact phone")).toHaveValue(profile.phone);
  await dialog.getByLabel("Location (optional)").fill("Nuseirat camp");
  await dialog.getByRole("button", { name: "Send emergency alert" }).click();

  await expect(dialog.getByRole("status")).toHaveText("Emergency alert sent.");
  expect(payload).toEqual({ phone: profile.phone, location: "Nuseirat camp", description: "" });
  await dialog.getByRole("button", { name: "Close" }).first().click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("#emergency-alerts li")).toHaveCount(1);
});

test("emergency dialog shows a safe error, keeps the input, and can be closed with Escape", async ({ page }) => {
  await setupPatient(page, (route) => reply(route, {}, 500));

  await page.locator("#emergency-alerts").getByRole("button", { name: "Send emergency alert" }).click();
  const dialog = page.getByRole("dialog", { name: "Send an emergency alert" });
  await dialog.getByLabel("Short description (optional)").fill("Severe asthma attack");
  await dialog.getByRole("button", { name: "Send emergency alert" }).click();

  await expect(dialog.getByRole("alert")).toContainText("Could not send the alert");
  await expect(dialog.getByLabel("Short description (optional)")).toHaveValue("Severe asthma attack");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("patient can fill the location from GPS, keep a typed landmark, and open it on a map", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 31.417713, longitude: 34.352318, accuracy: 15 });
  let payload;
  await setupPatient(page, (route) => {
    payload = route.request().postDataJSON();
    return reply(route, { emergency_alert: { id: 502, status: "PENDING_ASSIGNMENT", sent_at: "2026-11-10T10:00:00Z" } }, 201);
  });

  await page.locator("#emergency-alerts").getByRole("button", { name: "Send emergency alert" }).click();
  const dialog = page.getByRole("dialog", { name: "Send an emergency alert" });
  await dialog.getByLabel("Location (optional)").fill("Near the UN school");
  await dialog.getByRole("button", { name: "Use my current location" }).click();

  await expect(dialog.getByLabel("Location (optional)")).toHaveValue("31.41771, 34.35232 (±15 m) - Near the UN school");
  await expect(dialog.getByRole("link", { name: "View on map" })).toHaveAttribute("href", "https://www.google.com/maps?q=31.41771,34.35232");
  await dialog.getByRole("button", { name: "Send emergency alert" }).click();
  await expect(dialog.getByRole("status")).toHaveText("Emergency alert sent.");
  expect(payload.location).toBe("31.41771, 34.35232 (±15 m) - Near the UN school");
});

test("denied location permission shows a clear message and keeps manual entry available", async ({ page, context }) => {
  await context.clearPermissions();
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_success, error) => error({ code: 1, message: "denied" });
  });
  await setupPatient(page, (route) => reply(route, {}, 500));

  await page.locator("#emergency-alerts").getByRole("button", { name: "Send emergency alert" }).click();
  const dialog = page.getByRole("dialog", { name: "Send an emergency alert" });
  await dialog.getByRole("button", { name: "Use my current location" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Location access was denied. Type your location instead.");
  await dialog.getByLabel("Location (optional)").fill("Deir al-Balah shelter");
  await expect(dialog.getByLabel("Location (optional)")).toHaveValue("Deir al-Balah shelter");
  await expect(dialog.getByRole("link", { name: "View on map" })).toHaveCount(0);
});
