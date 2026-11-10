import { expect, test } from "@playwright/test";

const reply = (route, data, status = 200) => route.fulfill({ status, json: { success: status < 400, data } });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
});

test("administrator overview lists what needs attention, in priority order, with links", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("hcms_access_token", "admin-attention-token"));
  await page.route("**/api/auth/me", (route) => reply(route, { user: { id: 1, full_name: "Admin", role: "ADMIN", status: "ACTIVE" } }));
  await page.route("**/api/admin/dashboard", (route) => reply(route, {
    total_patients: 4, total_doctors: 2, total_ngos: 1,
    pending_join_requests: 0, active_emergency_alerts: 2, pending_assistance_requests: 0,
  }));
  await page.route("**/api/admin/emergency-alerts", (route) => reply(route, { emergency_alerts: [
    { id: 1, status: "PENDING_ASSIGNMENT", phone: "0590000001", sent_at: "2026-11-10T10:00:00Z" },
    { id: 2, status: "PENDING_ASSIGNMENT", phone: "0590000002", sent_at: "2026-11-10T10:05:00Z" },
    { id: 3, status: "RESOLVED", phone: "0590000003", sent_at: "2026-11-09T10:00:00Z" },
  ] }));
  await page.route("**/api/admin/patient-intakes", (route) => reply(route, { intakes: [
    { id: 11, status: "SUBMITTED", patient_name: "New Patient" },
    { id: 12, status: "DOCTOR_ASSIGNED", patient_name: "Assigned Patient" },
  ] }));
  await page.route("**/api/admin/active-doctors", (route) => reply(route, { doctors: [] }));
  await page.route("**/api/admin/intake-correction-requests", (route) => reply(route, { requests: [] }));

  await page.goto("/admin");
  const panel = page.getByRole("region", { name: "Needs your attention" });
  const cards = panel.getByRole("list").first().getByRole("listitem");
  await expect(cards.first()).toContainText("2");
  await expect(cards.first()).toContainText("Emergency alerts awaiting a doctor");
  await expect(cards.nth(1)).toContainText("New health forms");
  // Zero-count items are shown as calm "all done" chips, not as action cards.
  await expect(panel.getByText("✓ Doctor and NGO applications")).toBeVisible();
  await expect(panel.getByRole("link", { name: "Review" })).toHaveCount(1);

  await panel.getByRole("link", { name: "Assign now" }).click();
  await expect(page).toHaveURL(/\/admin\/emergency-alerts$/);
});

test("patient overview asks to complete the health form when none exists", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("hcms_access_token", "patient-attention-token"));
  await page.route("**/api/auth/me", (route) => reply(route, { user: { id: 2, full_name: "Patient", role: "PATIENT", status: "ACTIVE" } }));
  await page.route("**/api/patient/dashboard", (route) => reply(route, {
    active_treatment_plans: 0, pending_reminders: 0, active_emergency_alerts: 0,
    pending_assistance_requests: 0, unread_notifications: 0,
  }));
  await page.route("**/api/patient/intake", (route) => reply(route, { intake: null }));
  await page.route("**/api/patient/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/patient/doctor-assignments", (route) => reply(route, { assignments: [] }));
  await page.route("**/api/patient/diagnoses", (route) => reply(route, { diagnoses: [] }));
  await page.route("**/api/patient/emergency-alerts", (route) => reply(route, { emergency_alerts: [
    { id: 9, status: "CANCELLED", sent_at: "2026-11-09T10:00:00Z" },
  ] }));
  await page.route("**/api/profile", (route) => reply(route, { profile: { full_name: "Patient", phone: "0591112223" } }));

  await page.goto("/patient");
  const panel = page.getByRole("region", { name: "Needs your attention" });
  const actionCards = panel.getByRole("list").first().getByRole("listitem");
  await expect(actionCards).toHaveCount(1);
  await expect(actionCards).toContainText("Complete your health information");
  // A cancelled alert is not an open emergency.
  await expect(panel.getByText("✓ No open emergency alerts")).toBeVisible();

  await panel.getByRole("link", { name: "Complete the form" }).click();
  await expect(page).toHaveURL(/\/patient\/health-information$/);
});
