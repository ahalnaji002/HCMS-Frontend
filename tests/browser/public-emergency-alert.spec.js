import { expect, test } from "@playwright/test";

const reply = (route, status, body) => route.fulfill({ status, json: body });

let requests;

test.beforeEach(async ({ page, context }) => {
  requests = [];
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.route("**/api/emergency-alerts", (route) => {
    requests.push(route.request().postDataJSON());
    return reply(route, 201, { success: true, data: { emergency_alert: { id: 1, status: "PENDING_ASSIGNMENT" } } });
  });
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 31.52083, longitude: 34.45923, accuracy: 20 });
});

const dialog = (page) => page.getByRole("dialog", { name: "Send an emergency alert" });
// The hero call to action and the floating button share the same accessible
// name; the floating button comes last in the document.
const heroButton = (page) => page.getByRole("button", { name: "Send an emergency alert" }).first();
const floatingButton = (page) => page.getByRole("button", { name: "Send an emergency alert" }).last();

test("hero call to action opens the form and sends a visitor alert with GPS location", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Medical emergency and no account?")).toBeVisible();
  await heroButton(page).click();

  const form = dialog(page);
  await expect(form).toBeVisible();
  await expect(form).toContainText("No account needed.");
  await form.getByLabel("Contact phone").fill(" 0599 123 456 ");
  await form.getByRole("button", { name: "Use my current location" }).click();
  await expect(form.getByLabel("Location (optional)")).toHaveValue(/^31\.52083, 34\.45923 \(±20 m\)$/);
  await expect(form.getByRole("link", { name: "View on map" })).toHaveAttribute("href", "https://www.google.com/maps?q=31.52083,34.45923");
  await form.getByLabel("Short description (optional)").fill("Injured child, bleeding");
  await form.getByRole("button", { name: "Send emergency alert" }).click();

  await expect(form.getByRole("status")).toContainText("Your emergency alert was sent.");
  expect(requests).toEqual([{ phone: "0599 123 456", location: "31.52083, 34.45923 (±20 m)", description: "Injured child, bleeding" }]);

  await form.getByRole("button", { name: "Close" }).last().click();
  await expect(form).toBeHidden();

  // The next alert starts from a clean form.
  await floatingButton(page).click();
  await expect(dialog(page).getByLabel("Contact phone")).toHaveValue("");
});

test("floating emergency button is available and optional fields are sent as null", async ({ page }) => {
  await page.goto("/");
  await floatingButton(page).click();
  await dialog(page).getByLabel("Contact phone").fill("+970599123456");
  await dialog(page).getByRole("button", { name: "Send emergency alert" }).click();

  await expect(dialog(page).getByRole("status")).toBeVisible();
  expect(requests).toEqual([{ phone: "+970599123456", location: null, description: null }]);
});

test("an undialable phone number is rejected before sending", async ({ page }) => {
  await page.goto("/");
  await floatingButton(page).click();
  const phone = dialog(page).getByLabel("Contact phone");
  await phone.fill("call me");
  await dialog(page).getByRole("button", { name: "Send emergency alert" }).click();

  await expect(dialog(page)).toContainText("Enter a phone number we can call");
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  expect(requests).toEqual([]);
});

test("rate limiting and server errors are explained and the form stays filled", async ({ page }) => {
  let status = 429;
  await page.route("**/api/emergency-alerts", (route) => reply(route, status, { success: false, message: "Too many requests" }));
  await page.goto("/");
  await floatingButton(page).click();
  await dialog(page).getByLabel("Contact phone").fill("0599123456");

  await dialog(page).getByRole("button", { name: "Send emergency alert" }).click();
  await expect(dialog(page).getByRole("alert")).toContainText("Too many alerts were sent from this connection.");

  status = 500;
  await dialog(page).getByRole("button", { name: "Send emergency alert" }).click();
  await expect(dialog(page).getByRole("alert")).toContainText("Could not send the alert.");
  await expect(dialog(page).getByLabel("Contact phone")).toHaveValue("0599123456");
});

test("the form is in Arabic for first-time visitors", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.goto("/");

  await page.getByRole("button", { name: "إرسال تنبيه طوارئ" }).first().click();
  const form = page.getByRole("dialog", { name: "إرسال تنبيه طوارئ" });
  await expect(form).toContainText("لا تحتاج إلى حساب.");
  await form.getByLabel("رقم للتواصل").fill("abc");
  await form.getByRole("button", { name: "إرسال تنبيه طارئ" }).click();
  await expect(form).toContainText("اكتب رقم هاتف يمكن الاتصال به");
  await context.close();
});
