import { expect, test } from "@playwright/test";

const token = "ngo-assistance-requests-test-token";
const ngo = { id: 12, full_name: "Relief Organization", role: "NGO", status: "ACTIVE" };
const assistanceRequest = {
  id: 52,
  patient_id: 101,
  doctor_id: 7,
  ngo_id: 12,
  request_type: "Medical supplies",
  description: "Wheelchair and wound care supplies are needed.",
  status: "UNDER_REVIEW",
  submitted_at: "2026-11-11T10:00:00.000Z",
  reviewed_at: null,
  created_at: "2026-11-11T10:00:00.000Z",
  updated_at: "2026-11-12T10:00:00.000Z",
};

const reply = (route, data, status = 200) => route.fulfill({
  status,
  json: { success: status < 400, data },
});

async function authenticateAsNgo(page) {
  await page.addInitScript((value) => localStorage.setItem("hcms_access_token", value), token);
  await page.route("**/api/auth/me", (route) => reply(route, { user: ngo }));
  await page.route("**/api/ngo/dashboard", (route) => reply(route, {
    assigned_assistance_requests: 1,
    resource_allocations: 0,
  }));
}

test("NGO sees assigned requests and opens a read-only request detail page", async ({ page }) => {
  await authenticateAsNgo(page);
  const calls = [];
  await page.route("**/api/ngo/assistance-requests", (route) => {
    calls.push({ method: route.request().method(), url: route.request().url() });
    return reply(route, { assistance_requests: [assistanceRequest] });
  });
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => {
    calls.push({ method: route.request().method(), url: route.request().url() });
    return reply(route, { assistance_request: assistanceRequest });
  });

  await page.goto("/ngo/assistance-requests");
  await expect(page.getByRole("heading", { name: "Assigned assistance requests" })).toBeVisible();
  await expect(page.getByText("Assistance request #52")).toBeVisible();
  await expect(page.getByText("Under review")).toBeVisible();
  await expect(page.getByText("Wheelchair and wound care supplies are needed.")).toBeVisible();
  await page.getByRole("link", { name: "View details" }).click();

  await expect(page).toHaveURL(/\/ngo\/assistance-requests\/52$/);
  await expect(page.getByRole("heading", { name: "Assistance request #52" })).toBeVisible();
  await expect(page.getByText("Patient reference")).toBeVisible();
  await expect(page.getByText("101", { exact: true })).toBeVisible();
  await expect(page.getByText("Submitting doctor reference")).toBeVisible();
  await expect(page.getByText("7", { exact: true })).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.locator("article").getByRole("button")).toHaveCount(0);
  await expect(page.locator("article").getByRole("link")).toHaveCount(0);
  expect(calls.length).toBeGreaterThanOrEqual(2);
  expect(calls.every(({ method }) => method === "GET")).toBe(true);
});

test("direct NGO request detail route loads the request", async ({ page }) => {
  await authenticateAsNgo(page);
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => reply(route, { assistance_request: assistanceRequest }));

  await page.goto(`/ngo/assistance-requests/${assistanceRequest.id}`);
  await expect(page.getByRole("heading", { name: "Assistance request #52" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to assigned requests" })).toBeVisible();
});

test("NGO request list displays a clear empty state", async ({ page }) => {
  await authenticateAsNgo(page);
  await page.route("**/api/ngo/assistance-requests", (route) => reply(route, { assistance_requests: [] }));

  await page.goto("/ngo/assistance-requests");
  await expect(page.getByRole("status")).toHaveText("There are no assistance requests assigned to your organization yet.");
});

test("NGO request list announces its loading state", async ({ page }) => {
  await authenticateAsNgo(page);
  let finishRequest;
  const pendingResponse = new Promise((resolve) => { finishRequest = resolve; });
  await page.route("**/api/ngo/assistance-requests", async (route) => {
    await pendingResponse;
    return reply(route, { assistance_requests: [] });
  });

  await page.goto("/ngo/assistance-requests");
  await expect(page.getByRole("status")).toHaveText("Loading assigned assistance requests...");
  finishRequest();
  await expect(page.getByRole("status")).toHaveText("There are no assistance requests assigned to your organization yet.");
});

for (const [status, expected] of [
  [403, "You do not have permission to view this request."],
  [500, "Could not load assistance requests. Check your connection and try again."],
]) {
  test(`NGO request list handles HTTP ${status}`, async ({ page }) => {
    await authenticateAsNgo(page);
    await page.route("**/api/ngo/assistance-requests", (route) => reply(route, {}, status));

    await page.goto("/ngo/assistance-requests");
    await expect(page.getByRole("alert")).toContainText(expected);
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });
}

for (const [status, expected] of [
  [403, "You do not have permission to view this request."],
  [404, "This assistance request could not be found."],
  [500, "Could not load assistance requests. Check your connection and try again."],
]) {
  test(`NGO request detail handles HTTP ${status}`, async ({ page }) => {
    await authenticateAsNgo(page);
    await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => reply(route, {}, status));

    await page.goto(`/ngo/assistance-requests/${assistanceRequest.id}`);
    await expect(page.getByRole("alert")).toContainText(expected);
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });
}

test("NGO assistance request navigation is linked from the workspace", async ({ page }) => {
  await authenticateAsNgo(page);
  await page.route("**/api/ngo/assistance-requests", (route) => reply(route, { assistance_requests: [] }));

  await page.goto("/ngo");
  const link = page.locator('#role-navigation a[href="/ngo/assistance-requests"]');
  await expect(link).toHaveText("Assigned assistance requests");
  const menuButton = page.getByRole("button", { name: "Menu", exact: true });
  if (await menuButton.isVisible()) await menuButton.click();
  await link.click();
  await expect(page).toHaveURL(/\/ngo\/assistance-requests$/);
});
