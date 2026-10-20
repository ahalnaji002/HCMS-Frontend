import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const stamp = `${Date.now()}`;
const patient = {
  full_name: 'HCMS Integration Patient',
  email: `integration.patient.${stamp}@hcms.test`,
  password: 'Integration123',
  password_confirmation: 'Integration123',
  phone: '0591234567',
  national_id: String((Date.now() % 800_000_000) + 100_000_000),
  date_of_birth: '1995-04-12',
  gender: 'FEMALE',
  address: 'Test environment',
};

const doctor = {
  full_name: 'HCMS Integration Doctor',
  email: `integration.doctor.${stamp}@hcms.test`,
  password: 'Integration123',
  password_confirmation: 'Integration123',
  phone: '0561234567',
  specialization: 'General Medicine',
  license_number: `INT-${stamp}`,
};

const ngo = {
  full_name: 'HCMS Integration NGO',
  email: `integration.ngo.${stamp}@hcms.test`,
  password: 'Integration123',
  password_confirmation: 'Integration123',
  phone: '0597654321',
  organization_name: `Integration Organization ${stamp}`,
  registration_number: `INT-NGO-${stamp}`,
};

const cleanupScript = path.resolve(
  process.cwd(),
  '..',
  '..',
  '3.1 Backend',
  'HCMS-Backend',
  'scripts',
  'cleanupIntegrationTestAccounts.js',
);
const requireBackendModule = createRequire(cleanupScript);
const cleanupIntegrationTestAccounts = requireBackendModule(cleanupScript);

async function cleanupTestAccounts(options) {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  try {
    return await cleanupIntegrationTestAccounts(options);
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
}

test.beforeAll(async () => {
  const removed = await cleanupTestAccounts({ stale: true });
  console.log(`Removed ${removed} stale integration test account(s)`);
});

test.afterEach(async () => {
  const removed = await cleanupTestAccounts({ emails: [patient.email, doctor.email, ngo.email] });
  console.log(`Removed ${removed} test account(s) created by this run`);
});

async function fillForm(page, values) {
  for (const [name, value] of Object.entries(values)) {
    if (name === 'gender') await page.locator(`[name="${name}"]`).selectOption(value);
    else await page.locator(`[name="${name}"]`).fill(value);
  }
}

async function login(page, email, password) {
  await page.goto('/login');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.locator('button[type=submit]').click();
}

test('real test backend supports registration, login, RBAC and failure recovery', async ({ page, context }) => {
  // Confirm the protected frontend route redirects anonymous users.
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login$/);

  // Register an actual Patient through the browser and the test database.
  await page.goto('/register/patient');
  await fillForm(page, patient);
  await page.locator('button[type=submit]').click();
  await expect(page.getByRole('status')).toContainText('Your account is ready');

  // Exercise the real login and current-user APIs, then verify frontend role guards.
  await login(page, patient.email, patient.password);
  await expect(page).toHaveURL(/\/patient$/);
  const token = await page.evaluate(() => localStorage.getItem('hcms_access_token'));
  expect(token).toBeTruthy();
  const currentUser = await page.request.get(`${process.env.HCMS_API_URL || 'http://127.0.0.1:3000'}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(currentUser.status()).toBe(200);
  expect((await currentUser.json()).data.user.role).toBe('PATIENT');
  const forbidden = await page.request.get(`${process.env.HCMS_API_URL || 'http://127.0.0.1:3000'}/api/admin/join-requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(forbidden.status()).toBe(403);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/patient$/);

  // The application returns the backend's actual 401 for incorrect credentials.
  await page.locator('[aria-controls="account-menu"]').click();
  await page.getByRole('button', { name: /log out/i }).click();
  await login(page, patient.email, 'WrongPassword123');
  await expect(page.getByRole('alert')).toHaveText('The email address or password is incorrect.');

  // Retry with the actual patient credential, then create professional applications.
  await login(page, patient.email, patient.password);
  await expect(page).toHaveURL(/\/patient$/);
  await page.locator('[aria-controls="account-menu"]').click();
  await page.getByRole('button', { name: /log out/i }).click();

  for (const [role, values] of [['doctor', doctor], ['ngo', ngo]]) {
    await page.goto(`/register/${role}`);
    await fillForm(page, values);
    await page.locator('button[type=submit]').click();
    await expect(page.getByRole('status')).toContainText('registration submitted');
    await login(page, values.email, values.password);
    await expect(page.locator('section[aria-live=polite]')).toContainText('Under review');
    expect(await page.evaluate(() => localStorage.getItem('hcms_access_token'))).toBeNull();
  }

  // Simulate an HTTP 500 at the browser boundary; the real API process stays up.
  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 500,
    json: { success: false, message: 'PRIVATE_TEST_SERVER_DETAIL' },
  }));
  await page.goto('/login');
  await page.getByLabel('Email address', { exact: true }).fill(patient.email);
  await page.getByLabel('Password', { exact: true }).fill(patient.password);
  await page.locator('button[type=submit]').click();
  await expect(page.getByRole('alert')).toHaveText('An error occurred while logging in. Please try again.');
  await expect(page.locator('body')).not.toContainText('PRIVATE_TEST_SERVER_DETAIL');
  await page.unroute('**/api/auth/login');

  // Browser offline mode exercises a real request failure and a live retry.
  await context.setOffline(true);
  await page.locator('button[type=submit]').click();
  await expect(page.getByRole('alert')).toContainText('Unable to connect to the server');
  await context.setOffline(false);
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL(/\/patient$/);
});
