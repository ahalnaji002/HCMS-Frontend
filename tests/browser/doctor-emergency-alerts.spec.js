import { expect, test } from "@playwright/test";

const reply = (route, data, status = 200, message) => route.fulfill({
  status,
  json: { success: status < 400, ...(message ? { message } : {}), data },
});

const baseAlerts = () => [
  {
    id: 7, status: "ASSIGNED", patient_id: 3, patient_name: "Sara Ahmad", patient_phone: "0591234567",
    phone: "0595576046", location: "31.52083, 34.45923 (±92 m) - Gaza", description: "Severe chest pain",
    sent_at: "2026-11-24T10:00:00Z", assigned_at: "2026-11-24T10:05:00Z", responded_at: null, resolved_at: null,
  },
  {
    id: 6, status: "IN_PROGRESS", patient_id: null, patient_name: null, patient_phone: null,
    phone: "0590000000", location: "Deir al-Balah shelter", description: null,
    sent_at: "2026-11-23T08:00:00Z", assigned_at: "2026-11-23T08:10:00Z", responded_at: "2026-11-23T08:20:00Z", resolved_at: null,
  },
  {
    id: 5, status: "RESOLVED", patient_id: 4, patient_name: "Omar Khaled", patient_phone: "0597777777",
    phone: "0597777777", location: null, description: "Fainted",
    sent_at: "2026-11-20T08:00:00Z", assigned_at: "2026-11-20T08:10:00Z", responded_at: "2026-11-20T08:20:00Z", resolved_at: "2026-11-20T09:00:00Z",
  },
];

let alerts;
let statusRequests;

test.beforeEach(async ({ page }) => {
  alerts = baseAlerts();
  statusRequests = [];
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript(() => localStorage.setItem("hcms_access_token", "doctor-emergency-token"));
  await page.route("**/api/auth/me", (route) => reply(route, { user: { id: 20, full_name: "Dr. Emergency", role: "DOCTOR", status: "ACTIVE" } }));
  await page.route("**/api/doctor/dashboard", (route) => reply(route, {
    active_patients: 0, assigned_emergency_alerts: 2, submitted_assistance_requests: 0,
  }));
  await page.route("**/api/doctor/patients", (route) => reply(route, { patients: [] }));
  await page.route("**/api/doctor/emergency-alerts", (route) => reply(route, { emergency_alerts: alerts }));
});

test("lists assigned alerts with call and map links, grouped by active and resolved", async ({ page }) => {
  await page.goto("/doctor/emergency-alerts");

  const active = page.locator("section", { has: page.getByRole("heading", { name: "Needs your response" }) }).locator("article");
  const closed = page.locator("section", { has: page.getByRole("heading", { name: "Resolved", level: 2 }) }).locator("article");
  await expect(active).toHaveCount(2);
  await expect(closed).toHaveCount(1);

  const sara = active.first();
  await expect(sara.getByRole("heading", { name: "Sara Ahmad" })).toBeVisible();
  await expect(sara.getByRole("link", { name: "0595576046" })).toHaveAttribute("href", "tel:0595576046");
  await expect(sara.getByRole("link", { name: "0591234567" })).toHaveAttribute("href", "tel:0591234567");
  await expect(sara.getByRole("link", { name: "View on map" })).toHaveAttribute("href", "https://www.google.com/maps?q=31.52083,34.45923");
  await expect(sara).toContainText("Severe chest pain");
  await expect(sara.getByRole("button", { name: "Start response" })).toBeVisible();

  const visitor = active.nth(1);
  await expect(visitor.getByRole("heading", { name: "Visitor (not registered)" })).toBeVisible();
  await expect(visitor.getByRole("link", { name: "View on map" })).toHaveCount(0);
  await expect(visitor.getByRole("button", { name: "Mark resolved" })).toBeVisible();

  await expect(closed.first().getByRole("button")).toHaveCount(0);
});

test("doctor starts and resolves an alert", async ({ page }) => {
  await page.route("**/api/doctor/emergency-alerts/*/status", async (route) => {
    const id = Number(route.request().url().split("/").at(-2));
    const { status } = route.request().postDataJSON();
    statusRequests.push({ id, status });
    const alert = alerts.find((item) => item.id === id);
    alert.status = status;
    return reply(route, { emergency_alert: { ...alert, patient_name: undefined, patient_phone: undefined } });
  });
  await page.goto("/doctor/emergency-alerts");

  const sara = page.locator("article", { has: page.getByRole("heading", { name: "Sara Ahmad" }) });
  await sara.getByRole("button", { name: "Start response" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Response started" })).toBeVisible();
  await expect(sara).toContainText("In progress");
  // The name survives the status response, which has no patient fields.
  await expect(sara.getByRole("heading", { name: "Sara Ahmad" })).toBeVisible();

  await sara.getByRole("button", { name: "Mark resolved" }).click();
  await expect(sara.getByRole("heading", { name: "Mark this emergency as resolved?" })).toBeVisible();
  await sara.getByRole("button", { name: "Yes, resolved" }).click();
  await expect(page.getByRole("status").filter({ hasText: "marked resolved" })).toBeVisible();

  const closed = page.locator("section", { has: page.getByRole("heading", { name: "Resolved", level: 2 }) });
  await expect(closed.getByRole("heading", { name: "Sara Ahmad" })).toBeVisible();
  expect(statusRequests).toEqual([{ id: 7, status: "IN_PROGRESS" }, { id: 7, status: "RESOLVED" }]);
});

test("a conflicting update shows a translated message and reloads the list", async ({ page }) => {
  let listCalls = 0;
  await page.route("**/api/doctor/emergency-alerts", (route) => {
    listCalls += 1;
    return reply(route, { emergency_alerts: alerts });
  });
  await page.route("**/api/doctor/emergency-alerts/*/status", (route) => {
    alerts[0].status = "IN_PROGRESS";
    return reply(route, undefined, 409, "Invalid Emergency Alert status transition");
  });
  await page.goto("/doctor/emergency-alerts");

  const sara = page.locator("article", { has: page.getByRole("heading", { name: "Sara Ahmad" }) });
  await expect(sara.getByRole("button", { name: "Start response" })).toBeVisible();
  const callsBefore = listCalls;
  await sara.getByRole("button", { name: "Start response" }).click();
  await expect(page.getByRole("alert")).toContainText("cannot move to that status");
  await expect(sara.getByRole("button", { name: "Mark resolved" })).toBeVisible();
  expect(listCalls).toBe(callsBefore + 1);
});

test("load failure offers a retry", async ({ page }) => {
  let fail = true;
  await page.route("**/api/doctor/emergency-alerts", (route) => (fail ? reply(route, undefined, 500) : reply(route, { emergency_alerts: [] })));
  await page.goto("/doctor/emergency-alerts");

  await expect(page.getByRole("alert")).toContainText("could not be loaded");
  fail = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("No emergency alert needs your response right now.")).toBeVisible();
});

test("sidebar and the overview emergency card open the page", async ({ page, isMobile }) => {
  await page.goto("/doctor");
  await page.getByRole("link", { name: "Open emergency alerts" }).first().click();
  await expect(page).toHaveURL(/\/doctor\/emergency-alerts$/);
  await expect(page.getByRole("heading", { name: "Emergency alerts", level: 1 })).toBeVisible();

  if (!isMobile) {
    await page.goto("/doctor");
    await page.getByRole("navigation").getByRole("link", { name: "Emergency alerts" }).click();
    await expect(page).toHaveURL(/\/doctor\/emergency-alerts$/);
  }
});
