import { expect, test } from "@playwright/test";

const token = "admin-feedback-browser-test-token";
const admin = { id: 1, full_name: "System Administrator", role: "ADMIN", status: "ACTIVE" };
const reply = (route, data, status = 200) => route.fulfill({ status, json: { success: status < 400, data } });

// Several intakes so the assignment button is far below the top of the page.
const intakes = [1, 2, 3].map((id) => ({
  id,
  patient_id: 10 + id,
  patient_name: `Patient ${id}`,
  patient_email: `patient${id}@example.test`,
  status: "UNDER_REVIEW",
  current_problem: "Leg fracture",
  symptoms: "Pain and swelling",
  symptom_onset: "Three weeks ago",
  chronic_conditions_answer: "NO",
  medications_answer: "NO",
  allergies_answer: "NO",
}));

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript((value) => localStorage.setItem("hcms_access_token", value), token);
  await page.route("**/api/auth/me", (route) => reply(route, { user: admin }));
  await page.route("**/api/admin/dashboard", (route) => reply(route, {
    total_patients: 3, total_doctors: 0, total_ngos: 0,
    pending_join_requests: 0, active_emergency_alerts: 0, pending_assistance_requests: 0,
  }));
  await page.route("**/api/admin/patient-intakes", (route) => reply(route, { intakes }));
  await page.route("**/api/admin/active-doctors", (route) => reply(route, { doctors: [] }));
  await page.route("**/api/admin/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/admin/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
});

test("action feedback is visible where the user is, follows the language, and is cleared on page change", async ({ page }) => {
  await page.goto("/admin/patient-intakes");
  const saveButtons = page.getByRole("button", { name: "Save assignment" });
  await expect(saveButtons).toHaveCount(3);

  // Trigger the validation message from the last card, far down the page.
  await saveButtons.last().scrollIntoViewIfNeeded();
  await saveButtons.last().click();
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Select a doctor and enter an assignment reason.");
  await expect(alert).toBeInViewport();

  // The message is translated when the language changes.
  await page.getByRole("button", { name: "Switch to Arabic" }).click();
  await expect(page.getByRole("alert")).toContainText("اختر طبيبًا واكتب سبب التعيين.");
  await page.getByRole("button", { name: "التبديل إلى الإنجليزية" }).click();

  // Moving to another page through the sidebar (no reload) clears it.
  await expect(page.getByRole("alert")).toBeVisible();
  const menuButton = page.getByRole("button", { name: "Menu", exact: true });
  if (await menuButton.isVisible()) await menuButton.click();
  await page.getByRole("navigation").getByRole("link", { name: "Emergency alerts" }).click();
  await expect(page).toHaveURL(/\/admin\/emergency-alerts$/);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("feedback can be dismissed", async ({ page }) => {
  await page.goto("/admin/patient-intakes");
  await page.getByRole("button", { name: "Save assignment" }).first().click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss message" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
