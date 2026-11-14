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
  json: status < 400 ? { success: true, data } : { success: false, ...data },
});

async function authenticateAsNgo(page) {
  await page.addInitScript((value) => localStorage.setItem("hcms_access_token", value), token);
  await page.route("**/api/auth/me", (route) => reply(route, { user: ngo }));
  await page.route("**/api/ngo/dashboard", (route) => reply(route, {
    assigned_assistance_requests: 1,
    resource_allocations: 0,
  }));
}

test("NGO sees assigned requests and opens the request detail page with valid review actions", async ({ page }) => {
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
  await expect(page.locator("article").getByRole("button", { name: "Approve request" })).toBeVisible();
  await expect(page.locator("article").getByRole("button", { name: "Reject request" })).toBeVisible();
  await expect(page.locator("article").getByRole("button", { name: "Mark as completed" })).toHaveCount(0);
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

test("NGO can start review after confirmation and sees refreshed request details", async ({ page }) => {
  await authenticateAsNgo(page);
  let currentRequest = { ...assistanceRequest, status: "PENDING" };
  const updates = [];
  let detailLoads = 0;

  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => {
    detailLoads += 1;
    return reply(route, { assistance_request: currentRequest });
  });
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/status`, async (route) => {
    updates.push({ method: route.request().method(), body: route.request().postDataJSON() });
    currentRequest = { ...currentRequest, status: route.request().postDataJSON().status };
    return reply(route, { assistance_request: currentRequest });
  });
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto(`/ngo/assistance-requests/${assistanceRequest.id}`);
  await expect(page.getByRole("button", { name: "Start review" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve request" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reject request" })).toHaveCount(0);
  await page.getByRole("button", { name: "Start review" }).click();

  await expect(page.getByText("Under review")).toBeVisible();
  await expect(page.getByText("The request status was updated.")).toBeVisible();
  expect(updates).toEqual([{ method: "PATCH", body: { status: "UNDER_REVIEW" } }]);
  expect(detailLoads).toBeGreaterThanOrEqual(2);
});

test("NGO can approve or reject an under-review request, with only contract transitions shown", async ({ page }) => {
  await authenticateAsNgo(page);
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => reply(route, {
    assistance_request: { ...assistanceRequest, status: "UNDER_REVIEW" },
  }));

  await page.goto(`/ngo/assistance-requests/${assistanceRequest.id}`);
  await expect(page.getByRole("button", { name: "Approve request" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reject request" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark as completed" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start review" })).toHaveCount(0);
});

test("dismissing an NGO status confirmation does not send a status update", async ({ page }) => {
  await authenticateAsNgo(page);
  let updateCount = 0;
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => reply(route, {
    assistance_request: { ...assistanceRequest, status: "PENDING" },
  }));
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/status`, (route) => {
    updateCount += 1;
    return reply(route, {});
  });
  page.on("dialog", (dialog) => dialog.dismiss());

  await page.goto(`/ngo/assistance-requests/${assistanceRequest.id}`);
  await page.getByRole("button", { name: "Start review" }).click();
  await expect(page.getByText("Pending", { exact: true })).toBeVisible();
  expect(updateCount).toBe(0);
});

test("approved request cannot be completed until resource allocations are confirmed", async ({ page }) => {
  await authenticateAsNgo(page);
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => reply(route, {
    assistance_request: { ...assistanceRequest, status: "APPROVED" },
  }));
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/resources`, (route) => reply(route, {
    resource_allocations: [],
  }));

  await page.goto(`/ngo/assistance-requests/${assistanceRequest.id}`);
  await expect(page.getByText("At least one resource allocation is required before this request can be completed.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark as completed" })).toHaveCount(0);
});

test("approved request with an allocation can be completed and details reload", async ({ page }) => {
  await authenticateAsNgo(page);
  let currentRequest = { ...assistanceRequest, status: "APPROVED" };
  let detailLoads = 0;
  const updates = [];
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => {
    detailLoads += 1;
    return reply(route, { assistance_request: currentRequest });
  });
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/resources`, (route) => reply(route, {
    resource_allocations: [{ id: 4, resource_type: "Medical supplies", quantity: 1 }],
  }));
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/status`, async (route) => {
    const body = route.request().postDataJSON();
    updates.push(body);
    currentRequest = { ...currentRequest, status: body.status };
    return reply(route, { assistance_request: currentRequest });
  });
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto(`/ngo/assistance-requests/${assistanceRequest.id}`);
  await page.getByRole("button", { name: "Mark as completed" }).click();
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  expect(updates).toEqual([{ status: "COMPLETED" }]);
  expect(detailLoads).toBeGreaterThanOrEqual(2);
});

test("status conflict shows a friendly message and reloads the latest request", async ({ page }) => {
  await authenticateAsNgo(page);
  let detailLoads = 0;
  let latestStatus = "PENDING";
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => {
    detailLoads += 1;
    return reply(route, { assistance_request: { ...assistanceRequest, status: latestStatus } });
  });
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/status`, (route) => {
    latestStatus = "UNDER_REVIEW";
    return reply(route, { message: "Raw backend conflict detail" }, 409);
  });
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto(`/ngo/assistance-requests/${assistanceRequest.id}`);
  await page.getByRole("button", { name: "Start review" }).click();
  await expect(page.getByText("The request changed or this status transition is no longer valid. The latest details have been loaded.")).toBeVisible();
  await expect(page.getByText("Under review", { exact: true })).toBeVisible();
  await expect(page.getByText("Raw backend conflict detail")).toHaveCount(0);
  expect(detailLoads).toBeGreaterThanOrEqual(2);
});

test("NGO can create an allocation with only approved fields and sees the refreshed list", async ({ page }) => {
  await authenticateAsNgo(page);
  const allocations = [];
  const submittedBodies = [];
  let resourceLoads = 0;
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => reply(route, {
    assistance_request: { ...assistanceRequest, status: "APPROVED" },
  }));
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/resources`, (route) => {
    resourceLoads += 1;
    return reply(route, { resource_allocations: allocations });
  });
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/resources`, async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const body = route.request().postDataJSON();
    submittedBodies.push(body);
    allocations.push({ id: 701, assistance_request_id: 52, ...body, delivery_date: body.delivery_date ?? null, notes: body.notes ?? null });
    return reply(route, { resource_allocation: allocations[0] }, 201);
  });

  await page.goto(`/ngo/assistance-requests/${assistanceRequest.id}`);
  await expect(page.getByRole("heading", { name: "Resource allocations" })).toBeVisible();
  await page.getByLabel("Resource name").fill("Emergency medical kit");
  await page.getByLabel("Quantity", { exact: true }).last().fill("3");
  await page.getByLabel("Delivery date (optional)").fill("2026-12-01");
  await page.getByLabel("Notes (optional)").fill("Deliver to the clinic");
  await page.getByRole("button", { name: "Add allocation" }).click();

  await expect(page.getByRole("heading", { name: "Emergency medical kit" })).toBeVisible();
  await expect(page.getByText("The resource allocation was added.")).toBeVisible();
  expect(submittedBodies).toEqual([{
    resource_name: "Emergency medical kit",
    quantity: 3,
    delivery_date: "2026-12-01",
    notes: "Deliver to the clinic",
  }]);
  expect(resourceLoads).toBeGreaterThanOrEqual(2);
});

test("allocation form validates the resource name before sending a request", async ({ page }) => {
  await authenticateAsNgo(page);
  let createCount = 0;
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => reply(route, {
    assistance_request: { ...assistanceRequest, status: "APPROVED" },
  }));
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/resources`, (route) => {
    if (route.request().method() === "POST") createCount += 1;
    return reply(route, { resource_allocations: [] });
  });

  await page.goto(`/ngo/assistance-requests/${assistanceRequest.id}`);
  await page.getByLabel("Resource name").fill("   ");
  await page.getByRole("button", { name: "Add allocation" }).click();
  await expect(page.getByRole("alert")).toHaveText("Enter a resource name.");
  await page.getByLabel("Resource name").fill("Emergency kit");
  await page.getByLabel("Quantity", { exact: true }).fill("1.2");
  await page.getByRole("button", { name: "Add allocation" }).click();
  await expect(page.getByRole("alert")).toHaveText("Enter a whole quantity from 1 to 4,294,967,295.");
  expect(createCount).toBe(0);
});

test("NGO can edit an allocation and clear optional values using the approved PATCH fields", async ({ page }) => {
  await authenticateAsNgo(page);
  let allocation = {
    id: 701,
    assistance_request_id: 52,
    resource_name: "First aid kit",
    quantity: 2,
    delivery_date: "2026-12-01",
    notes: "Old note",
    created_at: "2026-11-13T10:00:00.000Z",
    updated_at: "2026-11-13T10:00:00.000Z",
  };
  const updateBodies = [];
  let resourceLoads = 0;
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => reply(route, {
    assistance_request: { ...assistanceRequest, status: "APPROVED" },
  }));
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/resources`, (route) => {
    resourceLoads += 1;
    return reply(route, { resource_allocations: [allocation] });
  });
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/resources/701`, async (route) => {
    if (route.request().method() !== "PATCH") return route.fallback();
    const body = route.request().postDataJSON();
    updateBodies.push(body);
    allocation = { ...allocation, ...body };
    return reply(route, { resource_allocation: allocation });
  });

  await page.goto(`/ngo/assistance-requests/${assistanceRequest.id}`);
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Resource name").first().fill("Updated first aid kit");
  await page.getByLabel("Quantity", { exact: true }).first().fill("4");
  await page.getByLabel("Delivery date (optional)").first().fill("");
  await page.getByLabel("Notes (optional)").first().fill("");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByRole("heading", { name: "Updated first aid kit" })).toBeVisible();
  await expect(page.getByText("The resource allocation was updated.")).toBeVisible();
  expect(updateBodies).toEqual([{
    resource_name: "Updated first aid kit",
    quantity: 4,
    delivery_date: null,
    notes: null,
  }]);
  expect(resourceLoads).toBeGreaterThanOrEqual(2);
});

test("NGO confirms allocation deletion and sees the refreshed empty state", async ({ page }) => {
  await authenticateAsNgo(page);
  let allocations = [{ id: 701, resource_name: "First aid kit", quantity: 2, delivery_date: null, notes: null }];
  let deleteCount = 0;
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => reply(route, {
    assistance_request: { ...assistanceRequest, status: "APPROVED" },
  }));
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/resources/701`, (route) => {
    if (route.request().method() !== "DELETE") return route.fallback();
    deleteCount += 1;
    allocations = [];
    return reply(route, { resource_allocation: { id: 701 } });
  });
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/resources`, (route) => reply(route, {
    resource_allocations: allocations,
  }));
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto(`/ngo/assistance-requests/${assistanceRequest.id}`);
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("No resources have been allocated to this request yet.")).toBeVisible();
  await expect(page.getByText("The resource allocation was deleted.")).toBeVisible();
  expect(deleteCount).toBe(1);
});

test("completed assistance requests show allocations read-only", async ({ page }) => {
  await authenticateAsNgo(page);
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => reply(route, {
    assistance_request: { ...assistanceRequest, status: "COMPLETED" },
  }));
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/resources`, (route) => reply(route, {
    resource_allocations: [{ id: 701, resource_name: "First aid kit", quantity: 2, delivery_date: null, notes: null }],
  }));

  await page.goto(`/ngo/assistance-requests/${assistanceRequest.id}`);
  await expect(page.getByRole("heading", { name: "First aid kit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add allocation" })).toHaveCount(0);
});

test("allocation availability conflict shows a localized message and refreshes allocations", async ({ page }) => {
  await authenticateAsNgo(page);
  let resourceLoads = 0;
  let requestStatus = "APPROVED";
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}`, (route) => reply(route, {
    assistance_request: { ...assistanceRequest, status: requestStatus },
  }));
  await page.route(`**/api/ngo/assistance-requests/${assistanceRequest.id}/resources`, async (route) => {
    if (route.request().method() === "POST") {
      requestStatus = "UNDER_REVIEW";
      return reply(route, { message: "Resource Allocations can only be created for approved Assistance Requests" }, 409);
    }
    resourceLoads += 1;
    return reply(route, { resource_allocations: [] });
  });

  await page.goto(`/ngo/assistance-requests/${assistanceRequest.id}`);
  await page.getByLabel("Resource name").fill("Emergency kit");
  await page.getByRole("button", { name: "Add allocation" }).click();
  await expect(page.getByRole("alert")).toContainText("Resources can be added only after the request is approved.");
  await expect(page.getByRole("button", { name: "Add allocation" })).toHaveCount(0);
  expect(resourceLoads).toBeGreaterThanOrEqual(2);
});
