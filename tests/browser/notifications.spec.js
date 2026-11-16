import { expect, test } from "@playwright/test";

const reply = (route, data, status = 200) => route.fulfill({ status, json: { success: status < 400, data } });
const notification = (overrides = {}) => ({
  id: 41,
  user_id: 17,
  title: "Treatment plan updated",
  message: "Your doctor updated your care plan.",
  type: "TREATMENT_PLAN",
  is_read: false,
  reference_type: "TREATMENT_PLAN",
  reference_id: 23,
  created_at: "2026-11-15T10:30:00Z",
  read_at: null,
  ...overrides,
});

async function setupRole(page, role) {
  const user = { id: 17, full_name: "Test User", role, status: "ACTIVE" };
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript(() => localStorage.setItem("hcms_access_token", "notifications-browser-test-token"));
  await page.route("**/api/auth/me", (route) => reply(route, { user }));
  await page.route(`**/api/${role.toLowerCase()}/dashboard`, (route) => reply(route, {}));

  if (role === "PATIENT") {
    await page.route("**/api/patient/intake", (route) => reply(route, { intake: null }));
    await page.route("**/api/patient/intake-correction-requests", (route) => reply(route, { requests: [] }));
    await page.route("**/api/patient/doctor-assignments", (route) => reply(route, { assignments: [] }));
    await page.route("**/api/patient/diagnoses", (route) => reply(route, { diagnoses: [] }));
    await page.route("**/api/patient/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
    await page.route("**/api/patient/medical-record", (route) => reply(route, {}, 404));
    await page.route("**/api/profile", (route) => reply(route, { profile: { full_name: user.full_name, phone: "0591234567" } }));
  }
  if (role === "DOCTOR") {
    await page.route("**/api/doctor/patients", (route) => reply(route, { patients: [] }));
  }
  if (role === "ADMIN") {
    await page.route("**/api/admin/patient-intakes", (route) => reply(route, { intakes: [] }));
    await page.route("**/api/admin/active-doctors", (route) => reply(route, { doctors: [] }));
    await page.route("**/api/admin/intake-correction-requests", (route) => reply(route, { requests: [] }));
    await page.route("**/api/admin/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
  }
  await page.route("**/api/notifications", (route) => reply(route, { notifications: [] }));
}

for (const role of ["PATIENT", "DOCTOR", "NGO", "ADMIN"]) {
  test(`${role} can open their own notifications page`, async ({ page }) => {
    await setupRole(page, role);
    await page.goto(`/${role.toLowerCase()}/notifications`);
    await expect(page.getByRole("heading", { name: "Notifications", level: 1 })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("You have no notifications yet.");
  });
}

test("shows approved notification content, creation time and unread count", async ({ page }) => {
  await setupRole(page, "PATIENT");
  await page.route("**/api/notifications", (route) => reply(route, { notifications: [notification()] }));
  await page.goto("/patient/notifications");

  await expect(page.getByRole("heading", { name: "Treatment plan updated" })).toBeVisible();
  await expect(page.getByText("Your doctor updated your care plan.")).toBeVisible();
  await expect(page.getByText("Unread: 1")).toBeVisible();
  await expect(page.locator("time")).toHaveAttribute("datetime", "2026-11-15T10:30:00Z");
});

test("marks one notification read using the approved empty PATCH body", async ({ page }) => {
  await setupRole(page, "PATIENT");
  await page.route("**/api/notifications", (route) => reply(route, { notifications: [notification()] }));
  await page.route("**/api/notifications/41/read", async (route) => {
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().postDataJSON()).toEqual({});
    await reply(route, { notification: notification({ is_read: true, read_at: "2026-11-16T08:00:00Z" }) });
  });
  await page.goto("/patient/notifications");
  await page.getByRole("button", { name: "Mark as read" }).click();
  await expect(page.getByRole("status")).toContainText("Notification marked as read.");
  await expect(page.getByText("Unread: 0")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark as read" })).toHaveCount(0);
});

test("marks all current user's notifications read using the approved endpoint", async ({ page }) => {
  await setupRole(page, "PATIENT");
  await page.route("**/api/notifications", (route) => reply(route, { notifications: [
    notification(), notification({ id: 42, title: "Emergency alert update" }),
  ] }));
  await page.route("**/api/notifications/read-all", async (route) => {
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().postDataJSON()).toEqual({});
    await reply(route, { updated_count: 2 });
  });
  await page.goto("/patient/notifications");
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await expect(page.getByRole("status")).toContainText("All notifications marked as read.");
  await expect(page.getByText("Unread: 0")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark as read" })).toHaveCount(0);
});

test("notification loading errors are safe and recover on retry", async ({ page }) => {
  await setupRole(page, "PATIENT");
  let attempts = 0;
  await page.route("**/api/notifications", (route) => {
    attempts += 1;
    return attempts === 1
      ? route.fulfill({ status: 500, json: { success: false, message: "Internal SQL detail" } })
      : reply(route, { notifications: [notification()] });
  });
  await page.goto("/patient/notifications");
  await expect(page.getByRole("alert")).toContainText("Could not load notifications. Try again.");
  await expect(page.getByRole("alert")).not.toContainText("Internal SQL");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Treatment plan updated" })).toBeVisible();
  expect(attempts).toBeGreaterThanOrEqual(2);
});
