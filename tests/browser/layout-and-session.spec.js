import { expect, test } from "@playwright/test";

const reply = (route, data, status = 200, message) => route.fulfill({
  status,
  json: { success: status < 400, ...(message ? { message } : {}), data },
});

const doctor = { id: 20, full_name: "Dr. Layout", role: "DOCTOR", status: "ACTIVE" };
const patient = { id: 17, full_name: "Lina Patient", role: "PATIENT", status: "ACTIVE" };
const manyPatients = Array.from({ length: 30 }, (_, index) => ({ id: index + 1, full_name: `Patient ${index + 1}` }));

async function setupDoctor(page, { alertsStatus = () => 200 } = {}) {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript(() => localStorage.setItem("hcms_access_token", "layout-doctor-token"));
  await page.route("**/api/auth/me", (route) => reply(route, { user: doctor }));
  await page.route("**/api/doctor/dashboard", (route) => reply(route, { active_patients: 30, assigned_emergency_alerts: 0, submitted_assistance_requests: 0 }));
  await page.route("**/api/doctor/patients", (route) => reply(route, { patients: manyPatients }));
  await page.route("**/api/doctor/patients/*/**", (route) => reply(route, {}, 404));
  await page.route("**/api/doctor/emergency-alerts", (route) => {
    const status = alertsStatus();
    return status === 200 ? reply(route, { emergency_alerts: [] }) : reply(route, undefined, status, "Authentication required");
  });
}

test("header stays on top and the sidebar starts right under it after scrolling", async ({ page, isMobile }) => {
  test.skip(isMobile, "The sidebar is a menu on phones.");
  await setupDoctor(page);
  await page.goto("/doctor/patients");
  await expect(page.getByRole("button", { name: "Patient 30" })).toBeVisible();

  await page.mouse.wheel(0, 1500);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);

  const header = await page.locator("header").first().boundingBox();
  const firstLink = await page.getByRole("navigation", { name: /navigation|التنقل/i }).getByRole("link").first().boundingBox();
  expect(header.y).toBe(0);
  // No empty band between the header and the first sidebar entry (UX-02).
  expect(firstLink.y - (header.y + header.height)).toBeLessThan(40);
});

test("phone header is a single compact row with a menu button", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Phone layout only.");
  await setupDoctor(page);
  await page.goto("/doctor");

  const header = await page.locator("header").first().boundingBox();
  expect(header.height).toBeLessThanOrEqual(72);
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(page.getByRole("navigation", { name: "Workspace navigation" }).getByRole("link", { name: "Emergency alerts" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("patient pages leave room for the floating emergency button", async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript(() => localStorage.setItem("hcms_access_token", "layout-patient-token"));
  await page.route("**/api/auth/me", (route) => reply(route, { user: patient }));
  await page.route("**/api/patient/dashboard", (route) => reply(route, { active_treatment_plans: 0, pending_reminders: 0, active_emergency_alerts: 0, pending_assistance_requests: 0, unread_notifications: 0 }));
  await page.route("**/api/patient/intake", (route) => reply(route, { intake: null }));
  await page.route("**/api/patient/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/patient/doctor-assignments", (route) => reply(route, { assignments: [] }));
  await page.route("**/api/patient/diagnoses", (route) => reply(route, { diagnoses: [] }));
  await page.route("**/api/patient/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
  await page.route("**/api/patient/medical-record", (route) => reply(route, {}, 404));
  await page.route("**/api/patient/treatment-plans", (route) => reply(route, { treatment_plans: [] }));
  await page.route("**/api/patient/reminders", (route) => reply(route, { reminders: [] }));
  await page.route("**/api/profile", (route) => reply(route, { profile: { full_name: patient.full_name, phone: "0591234567" } }));
  await page.goto("/patient/reminders");

  const button = page.getByRole("button", { name: "Send an emergency alert" }).last();
  await expect(button).toBeVisible();
  const padding = await page.locator("main").evaluate((main) => parseFloat(getComputedStyle(main).paddingBottom));
  const { height } = await button.boundingBox();
  expect(padding).toBeGreaterThan(height + 16);
});

test("an expired session explains itself and returns to the same page after signing in", async ({ page }) => {
  let expired = true;
  await setupDoctor(page, { alertsStatus: () => (expired ? 401 : 200) });
  await page.route("**/api/auth/login", (route) => {
    expired = false;
    return reply(route, { token: "fresh-doctor-token", user: doctor });
  });

  await page.goto("/doctor/emergency-alerts");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("status")).toContainText("Your session has ended");
  expect(await page.evaluate(() => localStorage.getItem("hcms_access_token"))).toBeNull();

  await page.getByLabel("Email").fill("doctor@test.local");
  await page.getByLabel("Password").fill("Secret123");
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  await expect(page).toHaveURL(/\/doctor\/emergency-alerts$/);
  await expect(page.getByRole("heading", { name: "Emergency alerts", level: 1 })).toBeVisible();
});

test("a normal visit to the login page shows no session message", async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Your session has ended")).toHaveCount(0);
});

test("pages that had no title now have exactly one page heading", async ({ page }) => {
  await setupDoctor(page);
  await page.route("**/api/auth/me", (route) => reply(route, { user: { id: 1, full_name: "Admin", role: "ADMIN", status: "ACTIVE" } }));
  await page.route("**/api/admin/dashboard", (route) => reply(route, { total_patients: 0, total_doctors: 0, total_ngos: 0, pending_join_requests: 0, active_emergency_alerts: 0, pending_assistance_requests: 0 }));
  await page.route("**/api/admin/patient-intakes", (route) => reply(route, { intakes: [] }));
  await page.route("**/api/admin/active-doctors", (route) => reply(route, { doctors: [] }));
  await page.route("**/api/admin/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
  await page.route("**/api/admin/intake-correction-requests", (route) => reply(route, { requests: [] }));
  for (const [path, title] of [
    ["/admin/emergency-alerts", "Emergency alerts"],
    ["/admin/patient-intakes", "Patient cases and assignments"],
    ["/admin/doctor-workload", "Doctor availability and workload"],
    ["/admin/support", "Patient form correction requests"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  }
});
