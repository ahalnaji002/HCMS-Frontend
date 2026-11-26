import { expect, test } from "@playwright/test";

const doctor = { id: 7, full_name: "Dr. Noor", role: "DOCTOR", status: "ACTIVE" };
const patients = [{ id: 101, full_name: "Patient A", email: "patient-a@example.test" }];

const reply = (route, data, status = 200) => route.fulfill({ status, json: { success: status < 400, data } });

let recordUpdates;

test.beforeEach(async ({ page }) => {
  recordUpdates = [];
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript(() => localStorage.setItem("hcms_access_token", "doctor-patient-file-token"));
  await page.route("**/api/auth/me", (route) => reply(route, { user: doctor }));
  await page.route("**/api/doctor/dashboard", (route) => reply(route, { active_patients: 1, assigned_emergency_alerts: 0, submitted_assistance_requests: 0 }));
  await page.route("**/api/doctor/patients", (route) => reply(route, { patients }));
  await page.route("**/api/doctor/patients/101/intake", (route) => reply(route, { intake: { current_problem: "Back pain", symptoms: "Stiffness" } }));
  await page.route("**/api/doctor/patients/101/medical-notes", (route) => reply(route, { medical_notes: [] }));
  await page.route("**/api/doctor/patients/101/diagnoses", (route) => reply(route, { diagnoses: [] }));
  await page.route("**/api/doctor/patients/101/treatment-plans", (route) => reply(route, { treatment_plans: [] }));
  await page.route("**/api/doctor/patients/101/medical-record", (route) => {
    const method = route.request().method();
    if (method === "PATCH") {
      const payload = route.request().postDataJSON();
      recordUpdates.push(payload);
      return reply(route, { medical_record: { id: 9, ...payload } });
    }
    return reply(route, { medical_record: { id: 9, blood_type: "A+", allergies: "", chronic_diseases: "", medical_history: "", previous_surgeries: "" } });
  });
  await page.goto("/doctor/patients");
});

test("the patient file is split into tabs, starting with the patient's own report", async ({ page }) => {
  const tabs = page.getByRole("tablist", { name: "Patient file" });
  await expect(tabs.getByRole("tab")).toHaveText(["Health report", "Medical record", "Diagnoses", "Notes", "Treatment plans", "Assistance request"]);
  await expect(tabs.getByRole("tab", { name: "Health report" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Back pain")).toBeVisible();
});

test("the medical record cannot be saved until something changes (UX-03)", async ({ page }) => {
  await page.getByRole("tab", { name: "Medical record" }).click();
  const save = page.getByRole("button", { name: "Save medical record" });
  await expect(page.getByLabel("Blood type")).toHaveValue("A+");
  await expect(save).toBeDisabled();
  await expect(page.getByText("Nothing to save yet")).toBeVisible();

  // Whitespace alone is not a change.
  await page.getByLabel("Allergies").fill("   ");
  await expect(save).toBeDisabled();

  await page.getByLabel("Allergies").fill("Penicillin");
  await expect(save).toBeEnabled();
  const box = await save.boundingBox();
  expect(box.height).toBeLessThan(60);

  await save.click();
  await expect(page.getByRole("status").filter({ hasText: "Medical record saved" })).toBeVisible();
  expect(recordUpdates).toEqual([{ blood_type: "A+", allergies: "Penicillin", chronic_diseases: "", medical_history: "", previous_surgeries: "" }]);
  await expect(save).toBeDisabled();
});

test("a half-typed draft survives switching tabs", async ({ page }) => {
  await page.getByRole("tab", { name: "Notes" }).click();
  await page.getByLabel(/Medical note/).fill("Follow up in two weeks");
  await page.getByRole("tab", { name: "Diagnoses" }).click();
  await page.getByRole("tab", { name: "Notes" }).click();
  await expect(page.getByLabel(/Medical note/)).toHaveValue("Follow up in two weeks");
});
