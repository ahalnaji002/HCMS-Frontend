import { expect, test } from "@playwright/test";

const admin = { id: 1, full_name: "System Administrator", role: "ADMIN", status: "ACTIVE" };
const settings = [
  { id: 1, setting_key: "system_name", setting_value: "HCMS", description: "Display name", updated_at: "2026-11-15T10:00:00Z" },
  { id: 2, setting_key: "support_email", setting_value: "help@example.test", description: "Support email", updated_at: "2026-11-15T10:00:00Z" },
  { id: 3, setting_key: "support_phone", setting_value: null, description: "Support phone", updated_at: "2026-11-15T10:00:00Z" },
  { id: 4, setting_key: "jwt_secret", setting_value: "must never be shown", description: "Secret", updated_at: "2026-11-15T10:00:00Z" },
];
const reply = (route, data, status = 200) => route.fulfill({ status, json: { success: status < 400, data } });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript(() => localStorage.setItem("hcms_access_token", "admin-system-settings-token"));
  await page.route("**/api/auth/me", (route) => reply(route, { user: admin }));
  await page.route("**/api/admin/dashboard", (route) => reply(route, {
    total_patients: 0, total_doctors: 0, total_ngos: 0,
    pending_join_requests: 0, active_emergency_alerts: 0, pending_assistance_requests: 0,
  }));
  await page.route("**/api/admin/patient-intakes", (route) => reply(route, { intakes: [] }));
  await page.route("**/api/admin/active-doctors", (route) => reply(route, { doctors: [] }));
  await page.route("**/api/admin/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/admin/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
  await page.route("**/api/admin/settings", (route) => reply(route, { settings }));
});

test("admin settings page lists only approved settings and is linked from the sidebar", async ({ page }) => {
  await page.goto("/admin/settings");
  await expect(page.getByRole("heading", { name: "System settings", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Setting value")).toHaveCount(3);
  await expect(page.getByText("must never be shown")).toHaveCount(0);
  const valueInputs = page.getByRole("textbox", { name: "Setting value" });
  await expect(valueInputs.nth(0)).toHaveValue("HCMS");
  await expect(valueInputs.nth(1)).toHaveValue("help@example.test");
  await expect(valueInputs.nth(2)).toHaveValue("");
  const menuButton = page.getByRole("button", { name: "Menu", exact: true });
  if (await menuButton.isVisible()) await menuButton.click();
  await expect(page.locator("#role-navigation a[href='/admin/settings']")).toBeVisible();
});

test("saves the approved system_name contract and displays success", async ({ page }) => {
  let payload;
  await page.route("**/api/admin/settings/system_name", async (route) => {
    expect(route.request().method()).toBe("PATCH");
    payload = route.request().postDataJSON();
    await reply(route, { setting: { ...settings[0], setting_value: "HCMS Care" } });
  });
  await page.goto("/admin/settings");
  const systemName = page.getByRole("textbox", { name: "Setting value" }).nth(0);
  await systemName.fill(" HCMS Care ");
  await page.getByRole("button", { name: "Save setting" }).nth(0).click();
  await expect(page.getByText("Setting saved successfully.", { exact: true })).toBeVisible();
  expect(payload).toEqual({ setting_value: "HCMS Care" });
  await expect(systemName).toHaveValue("HCMS Care");
});

test("clears nullable email as null and rejects invalid support phones before saving", async ({ page }) => {
  let emailPayload;
  let phoneRequests = 0;
  await page.route("**/api/admin/settings/support_email", async (route) => {
    emailPayload = route.request().postDataJSON();
    await reply(route, { setting: { ...settings[1], setting_value: null } });
  });
  await page.route("**/api/admin/settings/support_phone", (route) => {
    phoneRequests += 1;
    return reply(route, { setting: settings[2] });
  });
  await page.goto("/admin/settings");
  await page.getByRole("textbox", { name: "Setting value" }).nth(1).fill("   ");
  await page.getByRole("button", { name: "Save setting" }).nth(1).click();
  await expect(page.getByText("Setting saved successfully.", { exact: true })).toBeVisible();
  expect(emailPayload).toEqual({ setting_value: null });

  await page.getByRole("textbox", { name: "Setting value" }).nth(2).fill("1234567890");
  await page.getByRole("button", { name: "Save setting" }).nth(2).click();
  await expect(page.getByRole("alert")).toContainText("10-digit Palestinian mobile number");
  expect(phoneRequests).toBe(0);
});

test("shows safe save failures and loading errors with a retry", async ({ page }) => {
  await page.route("**/api/admin/settings/system_name", (route) => route.fulfill({
    status: 500, json: { success: false, message: "Internal database password" },
  }));
  await page.goto("/admin/settings");
  await page.getByRole("textbox", { name: "Setting value" }).nth(0).fill("Updated HCMS");
  await page.getByRole("button", { name: "Save setting" }).nth(0).click();
  await expect(page.getByRole("alert")).toContainText("The setting could not be saved. Try again.");
  await expect(page.getByRole("alert")).not.toContainText("database password");

  let attempts = 0;
  await page.route("**/api/admin/settings", (route) => {
    attempts += 1;
    return attempts <= 2
      ? route.fulfill({ status: 500, json: { success: false, message: "Internal detail" } })
      : reply(route, { settings });
  });
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("Could not load system settings. Try again.");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("textbox", { name: "Setting value" }).nth(0)).toHaveValue("HCMS");
  expect(attempts).toBeGreaterThanOrEqual(2);
});
