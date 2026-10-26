import { expect, test } from "@playwright/test";

const token = "admin-browser-test-token";
const admin = { id: 1, full_name: "System Administrator", role: "ADMIN", status: "ACTIVE" };
const dashboard = {
  total_patients: 0,
  total_doctors: 0,
  total_ngos: 0,
  pending_join_requests: 2,
  active_emergency_alerts: 0,
  pending_assistance_requests: 0,
};

const reply = (route, data, status = 200) => route.fulfill({
  status,
  json: { success: status < 400, data },
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
});

test("administrator reviews pending Doctor and NGO applications", async ({ page }) => {
  let pendingRequests = [
    {
      id: 101,
      request_type: "DOCTOR",
      status: "PENDING",
      created_at: "2026-10-26T09:00:00.000Z",
      user: {
        full_name: "Dr. Rami Saleh",
        email: "rami@example.test",
        phone: "970599000001",
        account_status: "INACTIVE",
      },
      doctor: { specialization: "Cardiology", license_number: "DOC-101" },
    },
    {
      id: 102,
      request_type: "NGO",
      status: "PENDING",
      created_at: "2026-10-26T10:00:00.000Z",
      user: {
        full_name: "Hope Care Organization",
        email: "hope@example.test",
        phone: "970599000002",
        account_status: "INACTIVE",
      },
      ngo: {
        organization_name: "Hope Care Organization",
        registration_number: "NGO-102",
        address: "Nablus",
        contact_phone: "970599000003",
      },
    },
  ];

  await page.addInitScript((value) => localStorage.setItem("hcms_access_token", value), token);
  await page.route("**/api/auth/me", (route) => reply(route, { user: admin }));
  await page.route("**/api/admin/dashboard", (route) => reply(route, dashboard));
  await page.route("**/api/admin/patient-intakes", (route) => reply(route, { intakes: [] }));
  await page.route("**/api/admin/active-doctors", (route) => reply(route, { doctors: [] }));
  await page.route("**/api/admin/intake-correction-requests", (route) => reply(route, { requests: [] }));
  await page.route("**/api/admin/emergency-alerts", (route) => reply(route, { emergency_alerts: [] }));
  await page.route("**/api/admin/join-requests", (route) => reply(route, { join_requests: pendingRequests }));
  await page.route("**/api/admin/join-requests/*", async (route) => {
    const { method, url } = route.request();
    const id = Number(url.split("/").at(-1));
    const request = pendingRequests.find((item) => item.id === id);
    expect(method).toBe("GET");
    await reply(route, { join_request: request });
  });
  await page.route("**/api/admin/join-requests/101/approve", async (route) => {
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().postDataJSON()).toEqual({});
    pendingRequests = pendingRequests.filter((request) => request.id !== 101);
    await reply(route, { join_request: { id: 101, status: "APPROVED" } });
  });
  await page.route("**/api/admin/join-requests/102/reject", async (route) => {
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().postDataJSON()).toEqual({ rejection_reason: "Registration number needs verification." });
    pendingRequests = pendingRequests.filter((request) => request.id !== 102);
    await reply(route, { join_request: { id: 102, status: "REJECTED" } });
  });

  await page.goto("/admin");
  const section = page.locator("#admin-join-requests");
  await expect(section.getByRole("heading", { name: "Doctor and NGO applications" })).toBeVisible();
  await expect(section.getByText("Dr. Rami Saleh")).toBeVisible();
  await expect(section.getByText("Hope Care Organization")).toBeVisible();

  await section.locator("article").filter({ hasText: "Dr. Rami Saleh" }).getByRole("button", { name: "View details" }).click();
  await expect(section).toContainText("Cardiology");
  await section.getByRole("button", { name: "Approve application" }).click();
  await expect(section.getByRole("status")).toContainText("approved");
  await expect(section.getByText("Dr. Rami Saleh")).toHaveCount(0);

  await section.locator("article").filter({ hasText: "Hope Care Organization" }).first().getByRole("button", { name: "View details" }).click();
  await section.getByRole("button", { name: "Reject application" }).click();
  await section.getByRole("button", { name: "Confirm rejection" }).click();
  await expect(section).toContainText("Enter a rejection reason.");
  await section.getByLabel("Rejection reason").fill("Registration number needs verification.");
  await section.getByRole("button", { name: "Confirm rejection" }).click();
  await expect(section.getByRole("status")).toContainText("rejected");
  await expect(section).toContainText("There are no pending applications.");
});
