import { expect, test } from "@playwright/test";

// A first-time visitor has no saved language preference.
test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
});

test("first-time visitors get the Arabic right-to-left interface", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("button", { name: "تسجيل الدخول" })).toBeVisible();
});

test("a language chosen with the toggle is remembered after reload", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "التبديل إلى الإنجليزية" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
});

test("an unknown saved language falls back to Arabic", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("hcms-language", "fr"));
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
});
