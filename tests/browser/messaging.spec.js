import { expect, test } from "@playwright/test";

const reply = (route, data, status = 200) => route.fulfill({ status, json: { success: status < 400, data } });

async function setupRole(page, role, conversations = []) {
  const user = {
    id: role === "PATIENT" ? 101 : 202,
    full_name: role === "PATIENT" ? "Patient Samira" : "Dr. Rami",
    role,
    status: "ACTIVE",
  };
  const prefix = `/api/${role.toLowerCase()}`;
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.addInitScript(() => localStorage.setItem("hcms_access_token", "messaging-browser-test-token"));
  await page.route("**/api/auth/me", (route) => reply(route, { user }));
  await page.route(`**${prefix}/dashboard`, (route) => reply(route, {
    active_treatment_plans: 0,
    pending_reminders: 0,
    active_emergency_alerts: 0,
    assigned_emergency_alerts: 0,
    pending_assistance_requests: 0,
    unread_notifications: 0,
  }));

  if (role === "PATIENT") {
    await page.route("**/api/patient/intake", (route) => reply(route, { intake: null }));
    await page.route("**/api/profile", (route) => reply(route, { profile: { full_name: user.full_name, phone: "0591112223" } }));
    await page.route("**/api/patient/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
    await page.route("**/api/patient/medical-record", (route) => reply(route, {}, 404));
    await page.route("**/api/patient/doctor-assignments", (route) => reply(route, { assignments: [] }));
    await page.route("**/api/patient/diagnoses", (route) => reply(route, { diagnoses: [] }));
  } else {
    await page.route("**/api/doctor/patients", (route) => reply(route, { patients: [] }));
  }

  await page.route("**/api/messages/conversations", (route) => reply(route, { conversations }));
}

const firstConversation = {
  participant: { id: 303, full_name: "Dr. Noura", role: "DOCTOR" },
  last_message: {
    id: 501,
    sender_id: 303,
    receiver_id: 101,
    message_text: "How are you feeling today?",
    is_read: false,
    sent_at: "2026-11-15T10:30:00Z",
  },
};

test("Patient can open the messages page through the role route and sees the empty state", async ({ page }) => {
  await setupRole(page, "PATIENT");
  await page.goto("/patient/messages");
  await expect(page.getByRole("heading", { name: "Messages", level: 1 })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("No existing conversations are available yet.");
});

test("Doctor messages route is available to an authenticated Doctor", async ({ page }) => {
  await setupRole(page, "DOCTOR");
  await page.goto("/doctor/messages");
  await expect(page.getByRole("heading", { name: "Messages", level: 1 })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("No existing conversations are available yet.");
});

test("opening a returned conversation loads history and marks received unread messages as read", async ({ page }) => {
  await setupRole(page, "PATIENT", [firstConversation]);
  const incoming = {
    id: 501, sender_id: 303, receiver_id: 101, message_text: "How are you feeling today?", is_read: false, sent_at: "2026-11-15T10:30:00Z",
  };
  await page.route("**/api/messages/conversations/303", (route) => reply(route, { messages: [incoming] }));
  await page.route("**/api/messages/501/read", async (route) => {
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().postDataJSON()).toEqual({});
    await reply(route, { message: { ...incoming, is_read: true, read_at: "2026-11-15T10:31:00Z" } });
  });

  await page.goto("/patient/messages");
  await page.getByRole("button", { name: /Dr\. Noura/ }).click();
  await expect(page.getByLabel("Conversation messages").getByText("How are you feeling today?")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dr. Noura" })).toBeVisible();
});

test("sends only the approved message fields to the selected participant", async ({ page }) => {
  await setupRole(page, "PATIENT", [firstConversation]);
  await page.route("**/api/messages/conversations/303", (route) => reply(route, { messages: [
    { ...firstConversation.last_message, is_read: true },
  ] }));
  await page.route("**/api/messages", async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({ receiver_id: 303, message_text: "I am feeling better." });
    await reply(route, { message: {
      id: 502, sender_id: 101, receiver_id: 303, message_text: "I am feeling better.", is_read: false, sent_at: "2026-11-15T10:32:00Z",
    } }, 201);
  });

  await page.goto("/patient/messages");
  await page.getByRole("button", { name: /Dr\. Noura/ }).click();
  await page.getByRole("textbox", { name: "Message" }).fill("I am feeling better.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByLabel("Conversation messages").getByText("I am feeling better.")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Message sent.");
});

test("backend assignment denial switches the thread to read-only and preserves the draft", async ({ page }) => {
  await setupRole(page, "PATIENT", [firstConversation]);
  await page.route("**/api/messages/conversations/303", (route) => reply(route, { messages: [
    { ...firstConversation.last_message, is_read: true },
  ] }));
  await page.route("**/api/messages", (route) => route.fulfill({
    status: 403,
    json: { success: false, message: "Active Doctor-Patient Assignment required" },
  }));

  await page.goto("/patient/messages");
  await page.getByRole("button", { name: /Dr\. Noura/ }).click();
  const composer = page.getByRole("textbox", { name: "Message" });
  await composer.fill("Please call me back.");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByRole("alert")).toContainText("A current active Doctor-Patient assignment is required to send messages.");
  await expect(composer).toHaveValue("Please call me back.");
  await expect(composer).toBeDisabled();
  await expect(page.getByText(/Messaging is unavailable because there is no active Doctor-Patient assignment/)).toContainText("You can still read this conversation.");
});

test("conversation list errors are localized and recover on retry", async ({ page }) => {
  await setupRole(page, "PATIENT");
  let attempts = 0;
  await page.route("**/api/messages/conversations", (route) => {
    attempts += 1;
    return attempts <= 2
      ? route.fulfill({ status: 500, json: { success: false, message: "Internal SQL detail" } })
      : reply(route, { conversations: [firstConversation] });
  });

  await page.goto("/patient/messages");
  await expect(page.getByRole("alert")).toContainText("Could not load conversations. Try again.");
  await expect(page.getByRole("alert")).not.toContainText("Internal SQL");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("button", { name: /Dr\. Noura/ })).toBeVisible();
  expect(attempts).toBeGreaterThanOrEqual(3);
});

test("history access errors are visible and retryable", async ({ page }) => {
  await setupRole(page, "PATIENT", [firstConversation]);
  let attempts = 0;
  await page.route("**/api/messages/conversations/303", (route) => {
    attempts += 1;
    return attempts === 1
      ? route.fulfill({ status: 403, json: { success: false, message: "Conversation access forbidden" } })
      : reply(route, { messages: [] });
  });

  await page.goto("/patient/messages");
  await page.getByRole("button", { name: /Dr\. Noura/ }).click();
  await expect(page.getByRole("alert")).toContainText("You do not have access to this conversation.");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("status")).toContainText("There are no messages in this conversation yet.");
  expect(attempts).toBeGreaterThanOrEqual(2);
});
