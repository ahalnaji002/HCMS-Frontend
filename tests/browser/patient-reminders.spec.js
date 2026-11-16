import { expect, test } from "@playwright/test";

const reply = (route, data, status = 200) => route.fulfill({ status, json: { success: status < 400, data } });
const futureLocalDateTime = () => {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const part = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}:${part(date.getSeconds())}`;
};

const patient = { id: 17, full_name: "Lina Patient", role: "PATIENT", status: "ACTIVE" };
const treatmentPlan = { id: 12, title: "Daily care", status: "ACTIVE", start_date: "2026-11-01", end_date: null };
const medication = { id: 42, medication_name: "Paracetamol", dosage: "500 mg", frequency: "Twice daily" };
const appointment = { id: 43, purpose: "Follow-up visit", appointment_date: "2026-11-18 09:15:00", status: "SCHEDULED" };
const dashboard = {
  active_treatment_plans: 1, pending_reminders: 0, active_emergency_alerts: 0,
  pending_assistance_requests: 0, unread_notifications: 0,
};

async function setupPatient(page, beforeNavigate = async () => {}) {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript(() => localStorage.setItem("hcms_access_token", "patient-reminders-browser-token"));
  await page.route("**/api/auth/me", (route) => reply(route, { user: patient }));
  await page.route("**/api/patient/dashboard", (route) => reply(route, dashboard));
  await page.route("**/api/patient/intake", (route) => reply(route, { intake: null }));
  await page.route("**/api/patient/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/patient/doctor-assignments", (route) => reply(route, { assignments: [] }));
  await page.route("**/api/patient/diagnoses", (route) => reply(route, { diagnoses: [] }));
  await page.route("**/api/patient/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
  await page.route("**/api/patient/medical-record", (route) => reply(route, {}, 404));
  await page.route("**/api/profile", (route) => reply(route, { profile: { full_name: patient.full_name, phone: "0591234567" } }));
  await page.route("**/api/patient/treatment-plans", (route) => reply(route, { treatment_plans: [treatmentPlan] }));
  await page.route("**/api/patient/treatment-plans/12/medications", (route) => reply(route, { medications: [medication] }));
  await page.route("**/api/patient/treatment-plans/12/appointments", (route) => reply(route, { appointments: [appointment] }));
  await page.route("**/api/patient/reminders", (route) => reply(route, { reminders: [] }));
  await beforeNavigate();
  await page.goto("/patient/reminders");
}

test("Patient can open the reminder page and sees the empty state", async ({ page }) => {
  await setupPatient(page);
  await expect(page.getByRole("heading", { name: "Reminders", level: 1 })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("You have no reminders yet.");
  await expect(page.getByRole("option", { name: /Paracetamol — Daily care/ })).toBeAttached();
});

test("shows reminder statuses and only allows pending reminders to be cancelled", async ({ page }) => {
  const reminders = [
    { id: 71, user_id: 17, type: "MEDICATION", reference_type: "TREATMENT_MEDICATION", reference_id: 42, remind_at: "2026-11-18 08:00:00", status: "PENDING", sent_at: null },
    { id: 72, user_id: 17, type: "APPOINTMENT", reference_type: "TREATMENT_APPOINTMENT", reference_id: 43, remind_at: "2026-11-18 09:00:00", status: "SENT", sent_at: "2026-11-18 09:00:02" },
    { id: 73, user_id: 17, type: "MEDICATION", reference_type: "TREATMENT_MEDICATION", reference_id: 42, remind_at: "2026-11-18 10:00:00", status: "CANCELLED", sent_at: null },
  ];
  await setupPatient(page, () => page.route("**/api/patient/reminders", (route) => reply(route, { reminders })));
  await expect(page.getByRole("article").filter({ hasText: "Pending" }).getByRole("heading", { name: "Paracetamol — Daily care" })).toBeVisible();
  await expect(page.getByText("Pending", { exact: true })).toBeVisible();
  await expect(page.getByText("Sent", { exact: true })).toBeVisible();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel reminder" })).toHaveCount(1);
});

test("creates an appointment reminder with the exact approved local-time payload", async ({ page }) => {
  const dueAt = futureLocalDateTime();
  let created;
  let list = [];
  await setupPatient(page, () => page.route("**/api/patient/reminders", async (route) => {
    if (route.request().method() === "POST") {
      created = route.request().postDataJSON();
      list = [{ id: 81, user_id: 17, type: "APPOINTMENT", reference_type: "TREATMENT_APPOINTMENT", reference_id: "43", remind_at: dueAt.replace("T", " "), status: "PENDING", sent_at: null }];
      await reply(route, { reminder: list[0] }, 201);
    } else await reply(route, { reminders: list });
  }));
  await page.getByLabel("Reminder for").selectOption("APPOINTMENT");
  await page.getByLabel("Appointment", { exact: true }).selectOption("43");
  await page.getByLabel("Reminder date and time").fill(dueAt);
  await page.getByRole("button", { name: "Schedule reminder" }).click();

  await expect(page.getByText("Reminder scheduled.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Follow-up visit.*Daily care/ })).toBeVisible();
  expect(created).toEqual({ type: "APPOINTMENT", reference_id: "43", remind_at: dueAt });
  expect(created.remind_at).not.toMatch(/[zZ]|[+-]\d\d:?\d\d$/);
});

test("creates a medication reminder and uses its server-derived status", async ({ page }) => {
  const dueAt = futureLocalDateTime();
  let payload;
  await setupPatient(page, () => page.route("**/api/patient/reminders", async (route) => {
    if (route.request().method() === "POST") {
      payload = route.request().postDataJSON();
      await reply(route, { reminder: {
        id: 82, user_id: 17, type: "MEDICATION", reference_type: "TREATMENT_MEDICATION", reference_id: "42",
        remind_at: dueAt.replace("T", " "), status: "PENDING", sent_at: null,
      } }, 201);
      return;
    }
    await reply(route, { reminders: [] });
  }));
  await page.getByLabel("Reminder for").selectOption("MEDICATION");
  await page.getByLabel("Medication", { exact: true }).selectOption("42");
  await page.getByLabel("Reminder date and time").fill(dueAt);
  await page.getByRole("button", { name: "Schedule reminder" }).click();

  expect(payload).toEqual({ type: "MEDICATION", reference_id: "42", remind_at: dueAt });
});

test("cancels a pending reminder with the approved empty PATCH body", async ({ page }) => {
  const pending = { id: 91, user_id: 17, type: "MEDICATION", reference_type: "TREATMENT_MEDICATION", reference_id: 42, remind_at: "2026-11-19 08:00:00", status: "PENDING", sent_at: null };
  let current = [pending];
  await setupPatient(page, async () => {
    await page.route("**/api/patient/reminders", (route) => reply(route, { reminders: current }));
    await page.route("**/api/patient/reminders/91/cancel", async (route) => {
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().postDataJSON()).toEqual({});
    current = [{ ...pending, status: "CANCELLED" }];
    await reply(route, { reminder: current[0] });
    });
  });

  await page.getByRole("button", { name: "Cancel reminder" }).click();
  await expect(page.getByRole("status")).toContainText("Reminder cancelled.");
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel reminder" })).toHaveCount(0);
});

test("rejects a past local reminder time before sending and explains validation", async ({ page }) => {
  let requests = 0;
  await setupPatient(page, () => page.route("**/api/patient/reminders", (route) => {
    if (route.request().method() === "POST") requests += 1;
    return reply(route, { reminders: [] });
  }));
  const past = new Date(Date.now() - 60_000);
  const part = (value) => String(value).padStart(2, "0");
  const pastValue = `${past.getFullYear()}-${part(past.getMonth() + 1)}-${part(past.getDate())}T${part(past.getHours())}:${part(past.getMinutes())}:${part(past.getSeconds())}`;
  await page.getByLabel("Medication", { exact: true }).selectOption("42");
  await page.getByLabel("Reminder date and time").fill(pastValue);
  await page.getByRole("button", { name: "Schedule reminder" }).click();
  await expect(page.getByRole("alert")).toContainText("Choose a valid date and time in the future.");
  expect(requests).toBe(0);
});

test("reminder loading errors are safe and recover on retry", async ({ page }) => {
  let attempts = 0;
  await setupPatient(page, () => page.route("**/api/patient/reminders", (route) => {
    attempts += 1;
    return attempts <= 2
      ? route.fulfill({ status: 500, json: { success: false, message: "Internal database detail" } })
      : reply(route, { reminders: [] });
  }));
  await expect(page.getByRole("alert")).toContainText("Could not load reminders or treatment plan items. Try again.");
  await expect(page.getByRole("alert")).not.toContainText("Internal database");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("status")).toContainText("You have no reminders yet.");
  expect(attempts).toBeGreaterThanOrEqual(3);
});
