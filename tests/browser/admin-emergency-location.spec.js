import { expect, test } from "@playwright/test";

const reply = (route, data, status = 200) => route.fulfill({ status, json: { success: status < 400, data } });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript(() => localStorage.setItem("hcms_access_token", "admin-location-token"));
  await page.route("**/api/auth/me", (route) => reply(route, { user: { id: 1, full_name: "Admin", role: "ADMIN", status: "ACTIVE" } }));
  await page.route("**/api/admin/dashboard", (route) => reply(route, {
    total_patients: 0, total_doctors: 0, total_ngos: 0,
    pending_join_requests: 0, active_emergency_alerts: 2, pending_assistance_requests: 0,
  }));
  await page.route("**/api/admin/patient-intakes", (route) => reply(route, { intakes: [] }));
  await page.route("**/api/admin/active-doctors", (route) => reply(route, { doctors: [] }));
  await page.route("**/api/admin/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/admin/emergency-alerts", (route) => reply(route, { emergency_alerts: [
    { id: 1, status: "PENDING_ASSIGNMENT", phone: "0595576046", location: "31.52083, 34.45923 (±92 m) - Gaza, Al-Jalaa St", sent_at: "2026-11-10T14:11:33Z" },
    { id: 2, status: "PENDING_ASSIGNMENT", phone: "0590000000", location: "Deir al-Balah shelter", sent_at: "2026-11-10T13:49:23Z" },
  ] }));
});

test("emergency alerts link the phone for a call and GPS coordinates to a map", async ({ page }) => {
  await page.goto("/admin/emergency-alerts");
  const alerts = page.locator("#admin-emergencies article");
  await expect(alerts).toHaveCount(2);

  await expect(alerts.first().getByRole("link", { name: "0595576046" })).toHaveAttribute("href", "tel:0595576046");
  await expect(alerts.first().getByRole("link", { name: "View on map" })).toHaveAttribute("href", "https://www.google.com/maps?q=31.52083,34.45923");

  // A typed location without coordinates has no map link.
  await expect(alerts.nth(1)).toContainText("Deir al-Balah shelter");
  await expect(alerts.nth(1).getByRole("link", { name: "View on map" })).toHaveCount(0);
});
