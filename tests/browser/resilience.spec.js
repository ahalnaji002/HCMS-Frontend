import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

// Pre-release D1: unknown URLs, failed page loads, and translation keys.

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
});

test("an unknown URL shows a not-found page with a way home (FE-03)", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");

  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Go to the home page" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("the not-found page follows the interface language", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("hcms-language", "ar"));
  await page.goto("/nowhere");

  await expect(page.getByRole("heading", { level: 1, name: "الصفحة غير موجودة" })).toBeVisible();
});

test("a page whose code fails to load reloads once, then shows a recoverable message (FE-02)", async ({ page }) => {
  let blocked = 0;
  await page.route("**/src/presentation/pages/auth/Login.jsx*", (route) => {
    blocked += 1;
    return route.abort("failed");
  });
  let loads = 0;
  page.on("load", () => {
    loads += 1;
  });

  await page.goto("/login");

  const alert = page.getByRole("alert");
  await expect(alert.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
  // First failure reloads automatically; the second shows the message
  // instead of reloading again.
  expect(loads).toBe(2);
  expect(blocked).toBeGreaterThanOrEqual(2);

  // Once the code loads again, "Reload page" recovers.
  await page.unroute("**/src/presentation/pages/auth/Login.jsx*");
  await alert.getByRole("button", { name: "Reload page" }).click();
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
});

test("every static translation key used in the code exists in Arabic and English (FE-01)", () => {
  const read = (language) =>
    JSON.parse(fs.readFileSync(path.resolve("src/presentation/i18n", `${language}.json`), "utf8"));
  const flatten = (object, prefix = "", into = new Set()) => {
    for (const [key, value] of Object.entries(object)) {
      const full = prefix ? `${prefix}.${key}` : key;
      // Objects count too: t("group", { returnObjects: true }) reads a whole group.
      if (value && typeof value === "object") {
        into.add(full);
        flatten(value, full, into);
      } else {
        into.add(full.replace(/_(zero|one|two|few|many|other)$/, ""));
      }
    }
    return into;
  };
  const languages = { ar: flatten(read("ar")), en: flatten(read("en")) };

  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|jsx)$/.test(entry.name)) files.push(full);
    }
  };
  walk(path.resolve("src"));

  const missing = [];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/\bt\(\s*["']([A-Za-z0-9_.]+)["']/g)) {
      for (const [language, keys] of Object.entries(languages)) {
        if (!keys.has(match[1])) missing.push(`${language}: ${match[1]} (${path.relative("src", file)})`);
      }
    }
  }

  expect(missing).toEqual([]);
});
