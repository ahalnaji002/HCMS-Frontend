import { expect, test } from "@playwright/test";

const token = "patient-assistance-browser-test-token";
const patient = { id: 119, full_name: "Rana Patient", role: "PATIENT", status: "ACTIVE" };
const assistanceRequests = [
  { id: 8101, request_type: "Food support", description: "Food supplies for the family.", status: "PENDING", submitted_at: "2026-11-12T09:00:00Z" },
  { id: 8102, request_type: "Transport", description: "Transport to a clinic.", status: "UNDER_REVIEW", submitted_at: "2026-11-11T09:00:00Z" },
  { id: 8103, request_type: "Medical supplies", description: "Medical supplies.", status: "APPROVED", submitted_at: "2026-11-10T09:00:00Z" },
  { id: 8104, request_type: "Shelter", description: "Temporary shelter.", status: "REJECTED", submitted_at: "2026-11-09T09:00:00Z" },
  { id: 8105, request_type: "Winter clothes", description: "Clothing for winter.", status: "COMPLETED", submitted_at: "2026-11-08T09:00:00Z" },
];
const reply = (route, data, status = 200, delay = 0) => route.fulfill({
  status,
  delay,
  json: { success: status < 400, data },
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
});

async function setupPatient(page, options = {}) {
  await page.addInitScript((value) => localStorage.setItem("hcms_access_token", value), token);
  await page.route("**/api/auth/me", (route) => reply(route, { user: patient }));
  await page.route("**/api/patient/dashboard", (route) => reply(route, { pending_assistance_requests: 0 }));
  await page.route("**/api/patient/intake", (route) => reply(route, { intake: null }));
  await page.route("**/api/patient/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/patient/doctor-assignments", (route) => reply(route, { assignments: [] }));
  await page.route("**/api/patient/diagnoses", (route) => reply(route, { diagnoses: [] }));
  await page.route("**/api/patient/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
  await page.route("**/api/profile", (route) => reply(route, { profile: { full_name: patient.full_name, phone: "0591234567" } }));
  await page.route("**/api/patient/assistance-requests", (route) => options.onList
    ? options.onList(route)
    : reply(route, { assistance_requests: options.requests ?? assistanceRequests }));
  await page.route("**/api/patient/assistance-requests/*/resources", (route) => {
    const requestId = Number(new URL(route.request().url()).pathname.split("/").at(-2));
    return options.onResources
      ? options.onResources(route, requestId)
      : reply(route, { resource_allocations: requestId === 8103 ? [{
        id: 9903,
        assistance_request_id: requestId,
        resource_name: "First aid kit",
        quantity: 2,
        delivery_date: "2026-11-21",
        notes: "Collect from the local clinic.",
      }] : [] });
  });
  await page.goto("/patient/assistance-requests");
}

test("patient follows assistance request statuses and allocated resources", async ({ page }) => {
  let listCalls = 0;
  let finishLoading;
  const loadingResponse = new Promise((resolve) => { finishLoading = resolve; });
  await setupPatient(page, {
    onList: async (route) => {
      listCalls += 1;
      await loadingResponse;
      return reply(route, { assistance_requests: assistanceRequests }, 200, 350);
    },
  });

  const section = page.locator('section[aria-labelledby="patient-assistance-title"]');
  await expect(section.getByRole("status")).toHaveText("Loading your assistance requests...");
  finishLoading();
  await expect(section.getByRole("heading", { name: "My assistance requests" })).toBeVisible();
  const navigationToggle = page.getByRole("button", { name: "Menu", exact: true });
  if (await navigationToggle.isVisible()) await navigationToggle.click();
  await expect(page.getByRole("link", { name: "Assistance requests" })).toHaveAttribute("href", "/patient/assistance-requests");

  for (const status of ["Pending", "Under review", "Approved", "Rejected", "Completed"]) {
    await expect(page.getByText(status, { exact: true })).toBeVisible();
  }

  const approvedRequest = page.locator("article").filter({ hasText: "#8103" });
  await expect(approvedRequest.getByText("First aid kit")).toBeVisible();
  await expect(approvedRequest.getByText("Quantity: 2")).toBeVisible();
  await expect(approvedRequest.getByText("Collect from the local clinic.")).toBeVisible();
  expect(listCalls).toBeGreaterThan(0);
});

test("patient sees an empty state when there are no assistance requests", async ({ page }) => {
  await setupPatient(page, { requests: [] });

  const section = page.locator('section[aria-labelledby="patient-assistance-title"]');
  await expect(section.getByRole("status")).toHaveText("You do not have any assistance requests yet.");
  await expect(section.getByRole("heading", { name: "My assistance requests" })).toBeVisible();
});

test("patient can retry after the assistance request service fails", async ({ page }) => {
  let calls = 0;
  await setupPatient(page, {
    onList: (route) => {
      calls += 1;
      return calls <= 2
        ? reply(route, {}, 503)
        : reply(route, { assistance_requests: [assistanceRequests[0]] });
    },
  });

  const section = page.locator('section[aria-labelledby="patient-assistance-title"]');
  await expect(section.getByRole("alert")).toContainText("Could not load your assistance requests.");
  const callsBeforeRetry = calls;
  await section.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator("article").getByText("Food support")).toBeVisible();
  expect(calls).toBeGreaterThan(callsBeforeRetry);
});
