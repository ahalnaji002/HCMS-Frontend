import { expect, test } from "@playwright/test";

const reply = (route, data, status = 200, message) => route.fulfill({
  status,
  json: { success: status < 400, ...(message ? { message } : {}), data },
});

const ADMIN = { id: 1, full_name: "Main Admin", email: "admin@test.local", role: "ADMIN", status: "ACTIVE" };

const baseUsers = () => [
  { id: 1, full_name: "Main Admin", email: "admin@test.local", role: "ADMIN", account_status: "ACTIVE", phone: null },
  { id: 2, full_name: "Sara Patient", email: "sara@test.local", role: "PATIENT", account_status: "ACTIVE", phone: "0591234567" },
  { id: 3, full_name: "Omar Doctor", email: "omar@test.local", role: "DOCTOR", account_status: "SUSPENDED", phone: null },
  { id: 4, full_name: "New Applicant", email: "applicant@test.local", role: "DOCTOR", account_status: "INACTIVE", phone: null },
];

const baseNgos = () => [
  {
    id: 1, user_id: 7, organization_name: "Gaza Relief", registration_number: "NGO-1", address: "Gaza",
    contact_phone: "0592222222", full_name: "Relief Manager", email: "relief@test.local", phone: null,
    account_status: "ACTIVE", assigned_requests: 5, open_requests: 2, completed_requests: 3,
  },
];

let users;
let ngos;
let userQueries;
let statusRequests;

test.beforeEach(async ({ page }) => {
  users = baseUsers();
  ngos = baseNgos();
  userQueries = [];
  statusRequests = [];
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript(() => localStorage.setItem("hcms_access_token", "admin-users-token"));
  await page.route("**/api/auth/me", (route) => reply(route, { user: ADMIN }));
  await page.route("**/api/admin/dashboard", (route) => reply(route, {
    total_patients: 1, total_doctors: 2, total_ngos: 1, pending_join_requests: 1, active_emergency_alerts: 0, pending_assistance_requests: 0,
  }));
  await page.route("**/api/admin/patient-intakes", (route) => reply(route, { intakes: [] }));
  await page.route("**/api/admin/active-doctors", (route) => reply(route, { doctors: [] }));
  await page.route("**/api/admin/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
  await page.route("**/api/admin/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/admin/users?*", (route) => {
    const url = new URL(route.request().url());
    const query = Object.fromEntries(url.searchParams);
    userQueries.push(query);
    let filtered = users;
    if (query.role) filtered = filtered.filter((user) => user.role === query.role);
    if (query.account_status) filtered = filtered.filter((user) => user.account_status === query.account_status);
    if (query.search) filtered = filtered.filter((user) => user.full_name.toLowerCase().includes(query.search.toLowerCase()));
    return reply(route, { users: filtered, page: Number(query.page || 1), limit: 20, total: filtered.length, total_pages: 1 });
  });
  await page.route("**/api/admin/ngos*", (route) => reply(route, { ngos }));
  await page.route("**/api/admin/users/*/status", (route) => {
    const userId = Number(route.request().url().split("/").at(-2));
    const { account_status: accountStatus } = route.request().postDataJSON();
    statusRequests.push({ userId, accountStatus });
    const user = users.find((item) => item.id === userId) || { id: userId, role: "NGO" };
    user.account_status = accountStatus;
    ngos.filter((ngo) => ngo.user_id === userId).forEach((ngo) => { ngo.account_status = accountStatus; });
    return reply(route, { user: { ...user, account_status: accountStatus } });
  });
});

const row = (page, name) => page.getByRole("listitem").filter({ hasText: name });

test("lists users with role, status, and the right action for each account", async ({ page }) => {
  await page.goto("/admin/users");

  await expect(page.getByRole("heading", { name: "User and organization management", level: 1 })).toBeVisible();
  await expect(page.getByText("4 accounts")).toBeVisible();
  await expect(row(page, "Main Admin")).toContainText("This is your account");
  await expect(row(page, "Main Admin").getByRole("button")).toHaveCount(0);
  await expect(row(page, "Sara Patient").getByRole("button", { name: "Deactivate" })).toBeVisible();
  await expect(row(page, "Omar Doctor").getByRole("button", { name: "Activate" })).toBeVisible();
  await expect(row(page, "New Applicant").getByRole("link", { name: "Review in Join Requests" })).toHaveAttribute("href", "/admin/join-requests");
});

test("filters by role and status and searches by name", async ({ page }) => {
  await page.goto("/admin/users");
  await expect(page.getByText("4 accounts")).toBeVisible();

  await page.getByLabel("Role").selectOption("DOCTOR");
  await expect(page.getByText("2 accounts")).toBeVisible();
  await page.getByLabel("Account status").selectOption("SUSPENDED");
  await expect(page.getByText("1 account", { exact: true })).toBeVisible();
  await expect(row(page, "Omar Doctor")).toBeVisible();

  await page.getByLabel("Role").selectOption("");
  await page.getByLabel("Account status").selectOption("");
  await page.getByRole("searchbox").fill("sara");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText("1 account", { exact: true })).toBeVisible();
  await expect(row(page, "Sara Patient")).toBeVisible();
  expect(userQueries.at(-1)).toEqual({ search: "sara", page: "1", limit: "20" });
});

test("deactivates after confirmation and re-activates", async ({ page }) => {
  await page.goto("/admin/users");

  await row(page, "Sara Patient").getByRole("button", { name: "Deactivate" }).click();
  await expect(page.getByText("Deactivate Sara Patient?")).toBeVisible();
  await page.getByRole("button", { name: "Yes, deactivate" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Sara Patient was deactivated." })).toBeVisible();
  await expect(row(page, "Sara Patient")).toContainText("Deactivated");

  await row(page, "Sara Patient").getByRole("button", { name: "Activate" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Sara Patient was activated." })).toBeVisible();
  expect(statusRequests).toEqual([
    { userId: 2, accountStatus: "SUSPENDED" },
    { userId: 2, accountStatus: "ACTIVE" },
  ]);
});

test("a rejected change shows the translated reason and reloads the list", async ({ page }) => {
  await page.route("**/api/admin/users/*/status", (route) => reply(route, undefined, 409, "The last active administrator cannot be deactivated"));
  await page.goto("/admin/users");
  await expect(page.getByText("4 accounts")).toBeVisible();
  const before = userQueries.length;

  await row(page, "Sara Patient").getByRole("button", { name: "Deactivate" }).click();
  await page.getByRole("button", { name: "Yes, deactivate" }).click();
  await expect(page.getByRole("alert")).toContainText("The last active administrator cannot be deactivated.");
  await expect.poll(() => userQueries.length).toBe(before + 1);
});

test("organizations page shows request counts and toggles the NGO account", async ({ page }) => {
  await page.goto("/admin/organizations");

  const card = page.getByRole("article", { name: "Gaza Relief" });
  await expect(card).toContainText("NGO-1");
  await expect(card).toContainText("Relief Manager");
  await expect(card.getByRole("link", { name: "0592222222" })).toHaveAttribute("href", "tel:0592222222");
  await expect(card.getByText("Assigned requests")).toBeVisible();
  await expect(card).toContainText("5");

  await card.getByRole("button", { name: "Deactivate" }).click();
  await card.getByRole("button", { name: "Yes, deactivate" }).click();
  await expect(card).toContainText("Deactivated");
  expect(statusRequests).toEqual([{ userId: 7, accountStatus: "SUSPENDED" }]);
});

test("sidebar entry and tabs open both pages", async ({ page, isMobile }) => {
  await page.goto("/admin");
  if (!isMobile) {
    await page.getByRole("navigation").getByRole("link", { name: "User and organization management" }).click();
    await expect(page).toHaveURL(/\/admin\/users$/);
  } else {
    await page.goto("/admin/users");
  }
  await page.getByRole("link", { name: "Organizations (NGOs)" }).click();
  await expect(page).toHaveURL(/\/admin\/organizations$/);
  await expect(page.getByRole("article", { name: "Gaza Relief" })).toBeVisible();
  await page.getByRole("link", { name: "Users", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/users$/);
});
