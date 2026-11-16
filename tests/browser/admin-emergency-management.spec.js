import { expect, test } from "@playwright/test";

const token = "admin-emergency-management-test-token";
const admin = { id: 1, full_name: "System Administrator", role: "ADMIN", status: "ACTIVE" };
const alerts = [
  { id: 71, status: "PENDING_ASSIGNMENT", phone: "0595576046", location: "Gaza", description: "Urgent assistance needed", sent_at: "2026-11-10T14:11:33Z" },
  { id: 72, status: "ASSIGNED", phone: "0590000000", location: "Nablus", description: "Doctor assigned", sent_at: "2026-11-10T13:49:23Z" },
];
const doctors = [
  { id: 5, full_name: "Dr. General", specialization: "General Medicine", availability: "AVAILABLE", active_assignment_count: 1, capacity_limit: 4 },
  { id: 6, full_name: "Dr. Emergency", specialization: "Emergency Medicine", availability: "UNAVAILABLE", active_assignment_count: 4, capacity_limit: 4 },
  { id: 7, full_name: "Dr. Cardiology", specialization: "Cardiology", availability: "AVAILABLE", active_assignment_count: 0, capacity_limit: null },
];
const reply = (route, data, status = 200) => route.fulfill({ status, json: { success: status < 400, data } });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript((value) => localStorage.setItem("hcms_access_token", value), token);
  await page.route("**/api/auth/me", (route) => reply(route, { user: admin }));
  await page.route("**/api/admin/dashboard", (route) => reply(route, {
    total_patients: 0, total_doctors: doctors.length, total_ngos: 0,
    pending_join_requests: 0, active_emergency_alerts: 1, pending_assistance_requests: 0,
  }));
  await page.route("**/api/admin/patient-intakes", (route) => reply(route, { intakes: [] }));
  await page.route("**/api/admin/active-doctors", (route) => reply(route, { doctors }));
  await page.route("**/api/admin/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/admin/emergency-alerts", (route) => reply(route, { emergency_alerts: alerts }));
});

test("shows alert statuses and only offers doctors with emergency-eligible specialties", async ({ page }) => {
  await page.goto("/admin/emergency-alerts");
  const section = page.locator("#admin-emergencies");
  const cards = section.locator("article");

  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText("Pending assignment");
  await expect(cards.nth(1)).toContainText("Doctor assigned");
  const doctorSelect = cards.first().getByRole("combobox", { name: "Emergency doctor" });
  await expect(doctorSelect.getByRole("option")).toHaveCount(3);
  await expect(doctorSelect).toContainText("Dr. General");
  await expect(doctorSelect).toContainText("Dr. Emergency");
  await expect(doctorSelect).not.toContainText("Dr. Cardiology");
  await expect(cards.nth(1).getByRole("combobox")).toHaveCount(0);
});

test("assigns a selected eligible doctor and refreshes the alert status", async ({ page }) => {
  let currentAlerts = alerts;
  await page.route("**/api/admin/emergency-alerts", (route) => reply(route, { emergency_alerts: currentAlerts }));
  await page.route("**/api/admin/emergency-alerts/71/assign", async (route) => {
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().postDataJSON()).toEqual({ doctor_id: 5 });
    currentAlerts = [
      { ...alerts[0], status: "ASSIGNED" },
      alerts[1],
    ];
    await reply(route, { emergency_alert: currentAlerts[0] });
  });

  await page.goto("/admin/emergency-alerts");
  const card = page.locator("#admin-emergencies article").first();
  await card.getByRole("combobox", { name: "Emergency doctor" }).selectOption("5");
  await card.getByRole("button", { name: "Assign emergency alert" }).click();

  await expect(page.getByRole("status")).toContainText("Emergency alert assigned.");
  await expect(page.locator("#admin-emergencies article").first()).toContainText("Doctor assigned");
  await expect(page.locator("#admin-emergencies article").first().getByRole("combobox")).toHaveCount(0);
});

test("refreshes stale alerts after an assignment conflict and explains the conflict", async ({ page }) => {
  let currentAlerts = alerts;
  let listRequests = 0;
  await page.route("**/api/admin/emergency-alerts", (route) => {
    listRequests += 1;
    return reply(route, { emergency_alerts: currentAlerts });
  });
  await page.route("**/api/admin/emergency-alerts/71/assign", (route) => route.fulfill({
    status: 409,
    json: { success: false, message: "Emergency Alert is not pending assignment" },
  }));

  await page.goto("/admin/emergency-alerts");
  const card = page.locator("#admin-emergencies article").first();
  await card.getByRole("combobox", { name: "Emergency doctor" }).selectOption("5");
  currentAlerts = [{ ...alerts[0], status: "ASSIGNED" }, alerts[1]];
  await card.getByRole("button", { name: "Assign emergency alert" }).click();

  await expect(page.getByRole("alert")).toContainText("This emergency alert is no longer waiting for a doctor.");
  await expect(page.locator("#admin-emergencies article").first()).toContainText("Doctor assigned");
  await expect(page.locator("#admin-emergencies article").first().getByRole("combobox")).toHaveCount(0);
  expect(listRequests).toBeGreaterThanOrEqual(2);
});

test("shows clear forbidden and server-error feedback without exposing server details", async ({ page }) => {
  await page.goto("/admin/emergency-alerts");
  const card = page.locator("#admin-emergencies article").first();
  await card.getByRole("combobox", { name: "Emergency doctor" }).selectOption("5");
  await page.route("**/api/admin/emergency-alerts/71/assign", (route) => route.fulfill({
    status: 403,
    json: { success: false, message: "Forbidden" },
  }));
  await card.getByRole("button", { name: "Assign emergency alert" }).click();
  await expect(page.getByRole("alert")).toHaveText("You do not have permission to assign this alert.");

  await page.getByRole("button", { name: "Dismiss message" }).click();
  await card.getByRole("combobox", { name: "Emergency doctor" }).selectOption("5");
  await page.route("**/api/admin/emergency-alerts/71/assign", (route) => route.fulfill({
    status: 500,
    json: { success: false, message: "Database credentials and internal SQL details" },
  }));
  await card.getByRole("button", { name: "Assign emergency alert" }).click();
  await expect(page.getByRole("alert")).toHaveText("Could not complete the action. Refresh the page and try again.");
  await expect(page.getByRole("alert")).not.toContainText("Database credentials");
});

test("shows an emergency-list load error and retries the request", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/admin/emergency-alerts", (route) => {
    attempts += 1;
    // React StrictMode mounts effects twice during development.
    return attempts <= 2
      ? route.fulfill({ status: 500, json: { success: false, message: "Internal detail" } })
      : reply(route, { emergency_alerts: alerts });
  });

  await page.goto("/admin/emergency-alerts");
  const section = page.locator("#admin-emergencies");
  await expect(section.getByRole("alert")).toHaveText("Could not load emergency alerts. Try again.");
  await expect(section.locator("article")).toHaveCount(0);
  await section.getByRole("button", { name: "Retry" }).click();
  await expect(section.locator("article")).toHaveCount(2);
  expect(attempts).toBeGreaterThanOrEqual(3);
});
