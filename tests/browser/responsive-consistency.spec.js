import { expect, test } from "@playwright/test";

const admin = { id: 1, full_name: "System Administrator", role: "ADMIN", status: "ACTIVE" };
const reply = (route, data) => route.fulfill({ status: 200, json: { success: true, data } });

test("Admin report stays usable from mobile through desktop widths", async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript(() => localStorage.setItem("hcms_access_token", "responsive-browser-token"));
  await page.route("**/api/auth/me", (route) => reply(route, { user: admin }));
  await page.route("**/api/admin/dashboard", (route) => reply(route, {
    total_patients: 0, total_doctors: 0, total_ngos: 0,
    pending_join_requests: 0, active_emergency_alerts: 0, pending_assistance_requests: 0,
  }));
  await page.route("**/api/admin/patient-intakes", (route) => reply(route, { intakes: [] }));
  await page.route("**/api/admin/active-doctors", (route) => reply(route, { doctors: [] }));
  await page.route("**/api/admin/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/admin/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
  await page.route("**/api/admin/reports/patients**", (route) => reply(route, {
    items: [{ id: 29, user_id: 9, full_name: "Maya Patient", created_at: "2026-11-15 09:30:00" }],
    page: 1, limit: 20, total: 1, total_pages: 1,
  }));

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/admin/reports");
  await expect(page.getByRole("table")).toBeVisible();
  const menuButton = page.getByRole("button", { name: "Menu", exact: true });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  await expect(page.locator("#role-navigation a[href='/admin/reports']")).toHaveAttribute("aria-current", "page");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect.poll(() => page.getByRole("table").evaluate((table) => table.parentElement.scrollWidth > table.parentElement.clientWidth)).toBe(true);

  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator("#role-navigation a[href='/admin/reports']")).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
