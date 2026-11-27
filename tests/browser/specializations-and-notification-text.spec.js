import { expect, test } from "@playwright/test";

const reply = (route, data, status = 200) => route.fulfill({ status, json: { success: status < 400, data } });

async function useArabic(page) {
  await page.addInitScript(() => localStorage.setItem("hcms-language", "ar"));
}

async function fillDoctorForm(page) {
  await page.locator('[name="full_name"]').fill("Browser Doctor");
  await page.locator('[name="email"]').fill("browser.doctor@hcms.test");
  await page.locator('[name="license_number"]').fill("LIC-777");
  await page.locator('[name="password"]').fill("Strong1Pass");
  await page.locator('[name="password_confirmation"]').fill("Strong1Pass");
}

test.describe("doctor specialization", () => {
  test("registration offers the fixed list and sends the stored value", async ({ page }) => {
    let payload;
    await page.route("**/api/auth/register/doctor", (route) => {
      payload = route.request().postDataJSON();
      return reply(route, {}, 201);
    });
    await page.goto("/register/doctor");

    const select = page.getByLabel("Specialization");
    await expect(select).toHaveJSProperty("tagName", "SELECT");
    await expect(select.getByRole("option")).toHaveCount(18);
    await fillDoctorForm(page);
    await page.locator("button[type=submit]").click();
    await expect(page.getByText("Choose your medical specialization.")).toBeVisible();
    expect(payload).toBeUndefined();

    await select.selectOption("Emergency Medicine");
    await page.locator("button[type=submit]").click();
    await expect(page.getByRole("status")).toContainText("registration submitted");
    expect(payload.specialization).toBe("Emergency Medicine");
  });

  test("Arabic registration shows translated specialization labels", async ({ page }) => {
    await useArabic(page);
    await page.goto("/register/doctor");
    const select = page.locator('[name="specialization"]');
    await expect(select.locator('option[value="General Medicine"]')).toHaveText("طب عام");
    await expect(select.locator('option[value="Otolaryngology"]')).toHaveText("الأنف والأذن والحنجرة");
  });

  test("join request details translate a listed specialization and keep older free text", async ({ page }) => {
    await useArabic(page);
    await page.addInitScript(() => localStorage.setItem("hcms_access_token", "specialization-test-token"));
    await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
    await page.route("**/api/auth/me", (route) => reply(route, { user: { id: 1, full_name: "Admin", role: "ADMIN", status: "ACTIVE" } }));
    await page.route("**/api/admin/dashboard", (route) => reply(route, {}));
    await page.route("**/api/admin/patient-intakes", (route) => reply(route, { intakes: [] }));
    await page.route("**/api/admin/active-doctors", (route) => reply(route, { doctors: [] }));
    await page.route("**/api/admin/intake-correction-requests", (route) => reply(route, { requests: [] }));
    await page.route("**/api/admin/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
    const requests = [
      { id: 1, request_type: "DOCTOR", status: "PENDING", created_at: "2026-11-01T08:00:00Z", user: { full_name: "د. منى", email: "mona@hcms.test", account_status: "INACTIVE" }, doctor: { specialization: "Pediatrics", license_number: "L-1" } },
      { id: 2, request_type: "DOCTOR", status: "PENDING", created_at: "2026-11-02T08:00:00Z", user: { full_name: "د. سامي", email: "sami@hcms.test", account_status: "INACTIVE" }, doctor: { specialization: "Sports medicine", license_number: "L-2" } },
    ];
    await page.route("**/api/admin/join-requests", (route) => reply(route, { join_requests: requests }));
    await page.route("**/api/admin/join-requests/*", (route) => {
      const id = Number(new URL(route.request().url()).pathname.split("/").at(-1));
      return reply(route, { join_request: requests.find((item) => item.id === id) });
    });
    await page.goto("/admin/join-requests");

    const section = page.locator("#admin-join-requests");
    await section.locator("article").filter({ hasText: "د. منى" }).getByRole("button", { name: "عرض التفاصيل" }).click();
    await expect(section).toContainText("طب الأطفال");
    await section.locator("article").filter({ hasText: "د. سامي" }).getByRole("button", { name: "عرض التفاصيل" }).click();
    await expect(section).toContainText("Sports medicine");
  });
});

test.describe("notification text", () => {
  async function openNotifications(page, notifications) {
    await page.addInitScript(() => localStorage.setItem("hcms_access_token", "notification-text-token"));
    await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
    await page.route("**/api/auth/me", (route) => reply(route, { user: { id: 17, full_name: "Test User", role: "PATIENT", status: "ACTIVE" } }));
    await page.route("**/api/notifications", (route) => reply(route, { notifications }));
    await page.goto("/patient/notifications");
  }

  const base = { user_id: 17, is_read: false, created_at: "2026-11-15T10:30:00Z", read_at: null };
  const notifications = [
    { ...base, id: 1, title: "Emergency Alert status updated", message: "Emergency Alert #12 is now IN_PROGRESS.", type: "EMERGENCY_ALERT", event: "EMERGENCY_ALERT_STATUS_CHANGED", event_status: "IN_PROGRESS", reference_type: "EMERGENCY_ALERT", reference_id: 12 },
    { ...base, id: 2, title: "Treatment Plan updated", message: "Treatment Plan #4 has been updated.", type: "TREATMENT_PLAN", event: "TREATMENT_PLAN_UPDATED", event_status: null, reference_type: "TREATMENT_PLAN", reference_id: 4 },
    { ...base, id: 3, title: "Server-only title", message: "Server-only message.", type: "REMINDER", event: null, event_status: null, reference_type: "REMINDER", reference_id: 8 },
  ];

  test("Arabic readers see notifications in Arabic, built from the event", async ({ page }) => {
    await useArabic(page);
    await openNotifications(page, notifications);

    await expect(page.getByRole("heading", { name: "تحديث على بلاغ الطوارئ" })).toBeVisible();
    await expect(page.getByText("حالة بلاغ الطوارئ رقم 12 الآن: قيد المتابعة.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "تم تحديث خطتك العلاجية" })).toBeVisible();
    await expect(page.getByText("عدّل طبيبك الخطة العلاجية رقم 4.")).toBeVisible();
    await expect(page.getByText("IN_PROGRESS")).toHaveCount(0);
  });

  test("English readers see readable statuses, and rows without an event keep the server text", async ({ page }) => {
    await openNotifications(page, notifications);

    await expect(page.getByText("Emergency alert #12 is now: In progress.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Server-only title" })).toBeVisible();
    await expect(page.getByText("Server-only message.")).toBeVisible();
  });
});
