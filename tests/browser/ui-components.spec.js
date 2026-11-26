import { expect, test } from "@playwright/test";

// Behaviour of the shared UI components, checked on the development gallery.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.goto("/dev/ui");
  await expect(page.getByRole("heading", { name: "UI components", level: 1 })).toBeVisible();
});

test("buttons and badges keep their own height inside a tall grid row", async ({ page }) => {
  const row = await page.getByTestId("tall-row").boundingBox();
  const button = await page.getByTestId("grid-button").boundingBox();
  const badge = await page.getByTestId("grid-badge").boundingBox();

  expect(row.height).toBeGreaterThanOrEqual(240);
  expect(button.height).toBeLessThan(row.height / 2);
  expect(badge.height).toBeLessThanOrEqual(32);
});

test("buttons react to hover and expose loading and disabled states", async ({ page, isMobile }) => {
  const secondary = page.getByRole("button", { name: "Secondary", exact: true });
  const before = await secondary.evaluate((element) => getComputedStyle(element).backgroundColor);
  if (!isMobile) {
    await secondary.hover();
    await expect.poll(() => secondary.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(before);
  }

  const saving = page.getByRole("button", { name: "Saving…" });
  await expect(saving).toBeDisabled();
  await expect(saving).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("button", { name: "Disabled" })).toBeDisabled();
});

test("fields connect label, hint, and error for assistive technology", async ({ page }) => {
  const phone = page.getByLabel("Contact phone");
  await expect(phone).toHaveAttribute("required", "");
  await expect(phone).toHaveAccessibleDescription("We call this number back.");

  await phone.fill("059");
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  await expect(phone).toHaveAccessibleDescription("We call this number back. Enter at least 7 digits.");

  await page.getByText("Role", { exact: true }).click();
  await expect(page.getByLabel("Role")).toBeFocused();
  await expect(page.getByLabel("Description (optional)", { exact: true })).toBeVisible();
});

test("success toasts close by themselves and error toasts stay until dismissed", async ({ page }) => {
  await page.clock.install();
  await page.getByRole("button", { name: "Show success toast" }).click();
  await page.getByRole("button", { name: "Show error toast" }).click();

  await expect(page.getByRole("status").filter({ hasText: "Medical record saved." })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Could not reach the server." })).toBeVisible();

  await page.clock.runFor(6500);
  await expect(page.getByText("Medical record saved.")).toBeHidden();
  const error = page.getByRole("alert").filter({ hasText: "Could not reach the server." });
  await expect(error).toBeVisible();

  await page.getByRole("button", { name: /dismiss|إغلاق/i }).first().click();
  await expect(error).toBeHidden();
});

test("confirm action asks before running and can be cancelled", async ({ page }) => {
  await page.getByRole("button", { name: "Deactivate" }).click();
  const group = page.getByRole("group", { name: "Deactivate Sara Ahmad?" });
  await expect(group).toBeVisible();

  await group.getByRole("button", { name: /cancel|إلغاء/i }).click();
  await expect(page.getByTestId("confirmed-count")).toHaveText("Confirmed: 0");

  await page.getByRole("button", { name: "Deactivate" }).click();
  await page.getByRole("button", { name: "Yes, deactivate" }).click();
  await expect(page.getByTestId("confirmed-count")).toHaveText("Confirmed: 1");
});

test("description list hides empty values", async ({ page }) => {
  await expect(page.getByText("Registration number")).toBeVisible();
  await expect(page.getByRole("link", { name: "0592222222" })).toHaveAttribute("href", "tel:0592222222");
  await expect(page.getByText("Address", { exact: true })).toHaveCount(0);
});

test("tabs switch panels by click and keyboard, and cards show selection", async ({ page }) => {
  const tablist = page.getByRole("tablist", { name: "Patient file" });
  await expect(page.getByRole("tabpanel")).toHaveText("Summary panel");

  await tablist.getByRole("tab", { name: "Medical record" }).click();
  await expect(page.getByRole("tabpanel")).toHaveText("Record panel");

  await page.keyboard.press("End");
  await expect(tablist.getByRole("tab", { name: /Treatment plans/ })).toBeFocused();
  await expect(tablist.getByRole("tab", { name: /Treatment plans/ })).toHaveAttribute("aria-selected", "true");

  const wound = page.getByRole("button", { name: /Wound care/ });
  await expect(wound).toHaveAttribute("aria-pressed", "false");
  await wound.click();
  await expect(wound).toHaveAttribute("aria-pressed", "true");
});

test("dates use one unambiguous format and date-only values never shift", async ({ page }) => {
  // English test profile: en-GB with month names.
  await expect(page.getByTestId("date-only")).toHaveText("5 Nov 2026");
  await expect(page.getByTestId("date-time")).toHaveText(/^10 Nov 2026, (14:07|2:07 pm)$/);
});
