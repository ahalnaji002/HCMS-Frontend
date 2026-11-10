import { expect, test } from "@playwright/test";

const token = "role-navigation-browser-test-token";
const patient = { id: 77, full_name: "Nav Patient", role: "PATIENT", status: "ACTIVE" };
const reply = (route, data, status = 200) => route.fulfill({ status, json: { success: status < 400, data } });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript((value) => localStorage.setItem("hcms_access_token", value), token);
  await page.route("**/api/auth/me", (route) => reply(route, { user: patient }));
  await page.route("**/api/patient/dashboard", (route) => reply(route, {
    active_treatment_plans: 0, pending_reminders: 0, active_emergency_alerts: 0,
    pending_assistance_requests: 0, unread_notifications: 0,
  }));
  await page.route("**/api/patient/intake", (route) => reply(route, { intake: null }));
  await page.route("**/api/patient/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/patient/doctor-assignments", (route) => reply(route, { assignments: [] }));
  await page.route("**/api/patient/diagnoses", (route) => reply(route, { diagnoses: [] }));
  await page.route("**/api/patient/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
  await page.route("**/api/patient/medical-record", (route) => reply(route, {}, 404));
  await page.route("**/api/patient/treatment-plans", (route) => reply(route, { treatment_plans: [] }));
  await page.route("**/api/profile", (route) => reply(route, { profile: { full_name: "Nav Patient", phone: "0591112223" } }));
});

// On small screens the sidebar sits behind the "Menu" button.
async function openSidebarLink(page, name) {
  const menuButton = page.getByRole("button", { name: "Menu", exact: true });
  if (await menuButton.isVisible()) await menuButton.click();
  await page.getByRole("navigation").getByRole("link", { name }).click();
}

test("sidebar links open separate pages and mark the current page", async ({ page }) => {
  await page.goto("/patient");
  const navLink = (href) => page.locator(`#role-navigation a[href="${href}"]`);
  await expect(navLink("/patient")).toHaveAttribute("aria-current", "page");

  await openSidebarLink(page, "Emergency alerts");
  await expect(page).toHaveURL(/\/patient\/emergency-alerts$/);
  await expect(navLink("/patient/emergency-alerts")).toHaveAttribute("aria-current", "page");
  await expect(navLink("/patient")).not.toHaveAttribute("aria-current", "page");
  await expect(page.locator("#emergency-alerts")).toBeVisible();
  await expect(page.locator("#patient-profile")).toHaveCount(0);

  await openSidebarLink(page, "My profile");
  await expect(page).toHaveURL(/\/patient\/profile$/);
  await expect(page.locator("#emergency-alerts")).toHaveCount(0);

  // Browser history works between pages.
  await page.goBack();
  await expect(page).toHaveURL(/\/patient\/emergency-alerts$/);
});

test("unknown workspace paths return to the overview", async ({ page }) => {
  await page.goto("/patient/does-not-exist");
  await expect(page).toHaveURL(/\/patient$/);
});
