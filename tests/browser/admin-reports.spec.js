import { expect, test } from "@playwright/test";

const admin = { id: 1, full_name: "System Administrator", role: "ADMIN", status: "ACTIVE" };
const reply = (route, data, status = 200) => route.fulfill({ status, json: { success: status < 400, data } });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript(() => localStorage.setItem("hcms_access_token", "admin-reports-browser-token"));
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
    items: [{ id: 29, user_id: 9, full_name: "Maya Patient", created_at: "2026-11-15 09:30:00", password_hash: "private" }],
    page: 1, limit: 20, total: 1, total_pages: 1,
  }));
  await page.route("**/api/admin/reports/treatment-plans**", (route) => reply(route, { items: [], page: 1, limit: 20, total: 0, total_pages: 0 }));
  await page.route("**/api/admin/reports/assistance-requests**", (route) => reply(route, { items: [], page: 1, limit: 20, total: 0, total_pages: 0 }));
});

test("shows the server-paginated Patient report using only approved fields", async ({ page }) => {
  let params;
  await page.route("**/api/admin/reports/patients**", async (route) => {
    params = Object.fromEntries(new URL(route.request().url()).searchParams);
    await reply(route, {
      items: [{ id: 29, user_id: 9, full_name: "Maya Patient", created_at: "2026-11-15 09:30:00", password_hash: "private" }],
      page: 1, limit: 20, total: 1, total_pages: 1,
    });
  });
  await page.goto("/admin/reports");
  await expect(page.getByRole("heading", { name: "Reports and statistics", level: 1 })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("row", { name: /29 9 Maya Patient/ })).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveCount(4);
  await expect(page.getByText("private")).toHaveCount(0);
  await expect(page.getByText("Records: 1", { exact: true })).toBeVisible();
  expect(params).toEqual({ page: "1", limit: "20" });

  const menuButton = page.getByRole("button", { name: "Menu", exact: true });
  if (await menuButton.isVisible()) await menuButton.click();
  await expect(page.locator("#role-navigation a[href='/admin/reports']")).toBeVisible();
});

test("requests only the approved Assistance Request filter and server pagination", async ({ page }) => {
  const requests = [];
  await page.route("**/api/admin/reports/assistance-requests**", async (route) => {
    const params = Object.fromEntries(new URL(route.request().url()).searchParams);
    requests.push(params);
    const currentPage = Number(params.page ?? 1);
    await reply(route, {
      items: [{ id: 80 + currentPage, patient_id: 15, doctor_id: null, ngo_id: null, status: params.status ?? "PENDING", request_type: "MEDICAL", created_at: "2026-11-16 08:30:00", updated_at: "2026-11-16 08:35:00" }],
      page: currentPage, limit: Number(params.limit ?? 20), total: 21, total_pages: 2,
    });
  });
  await page.goto("/admin/reports");
  await page.getByRole("tab", { name: "Assistance requests" }).click();
  const statusFilter = page.getByLabel("Assistance status");
  await expect(statusFilter.locator("option")).toHaveCount(6);
  await statusFilter.selectOption("APPROVED");
  await expect(page.getByRole("row", { name: /APPROVED|Approved/ })).toBeVisible();
  expect(requests).toContainEqual({ page: "1", limit: "20", status: "APPROVED" });

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Page 2 of 2", { exact: true })).toBeVisible();
  expect(requests).toContainEqual({ page: "2", limit: "20", status: "APPROVED" });
});

test("renders the approved Treatment Plan columns and server values", async ({ page }) => {
  await page.route("**/api/admin/reports/treatment-plans**", (route) => reply(route, {
    items: [{ id: 5, patient_id: 15, doctor_id: 3, status: "ACTIVE", start_date: "2026-11-01", end_date: null, created_at: "2026-11-10 10:00:00" }],
    page: 1, limit: 20, total: 1, total_pages: 1,
  }));
  await page.goto("/admin/reports");
  await page.getByRole("tab", { name: "Treatment plans" }).click();
  await expect(page.getByRole("columnheader")).toHaveCount(7);
  await expect(page.getByRole("row", { name: /5 15 3 ACTIVE/ })).toBeVisible();
  await expect(page.getByText("Records: 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();
});

test("hides internal report errors and retries safely", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/admin/reports/patients**", (route) => {
    attempts += 1;
    return attempts <= 2
      ? route.fulfill({ status: 500, json: { success: false, message: "SQL password internal detail" } })
      : reply(route, { items: [], page: 1, limit: 20, total: 0, total_pages: 0 });
  });
  await page.goto("/admin/reports");
  await expect(page.getByRole("alert")).toContainText("Could not load this report. Try again.");
  await expect(page.getByRole("alert")).not.toContainText("SQL password");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("status")).toContainText("No records are available");
  await expect(page.getByText("Records: 0", { exact: true })).toBeVisible();
  expect(attempts).toBeGreaterThanOrEqual(3);
});
