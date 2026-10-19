import { test, expect } from '@playwright/test';

// Synthetic contract fixtures: these tests never contact a real backend.
const token = 'browser-test-token';
const user = { id: 1, full_name: 'Test Organization', role: 'NGO', status: 'ACTIVE' };
const credentials = { email: 'browser@hcms.test', password: 'TestPassword123' };
const dashboard = { assigned_assistance_requests: 3, resource_allocations: 7 };
const reply = (route, data, status = 200) => route.fulfill({ status, json: { success: status < 400, data } });
const storedToken = (page) => page.evaluate(() => localStorage.getItem('hcms_access_token'));

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) => route.abort('blockedbyclient'));
});

async function session(page) {
  await page.addInitScript((value) => localStorage.setItem('hcms_access_token', value), token);
  await page.route('**/api/auth/me', (route) => reply(route, { user }));
  await page.route('**/api/ngo/dashboard', (route) => reply(route, dashboard));
}

async function fillLogin(page) {
  await page.goto('/login');
  await page.getByLabel('Email address', { exact: true }).fill(credentials.email);
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
}

for (const role of ['patient', 'doctor', 'ngo', 'admin']) {
  test(`anonymous ${role} route requires login`, async ({ page }) => {
    await page.goto(`/${role}`);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('#email')).toBeVisible();
  });
}

test('empty login validates locally without sending credentials', async ({ page }) => {
  let requests = 0;
  page.on('request', (request) => { if (request.url().endsWith('/api/auth/login')) requests++; });
  await page.goto('/login');
  await page.locator('button[type=submit]').click();
  await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#password')).toHaveAttribute('aria-invalid', 'true');
  expect(requests).toBe(0);
});

test('login stores session; restore sends bearer token; role guard and logout work', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toEqual(credentials);
    expect(route.request().headers().authorization).toBeUndefined();
    await reply(route, { token, user });
  });
  await page.route('**/api/auth/me', async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${token}`);
    await reply(route, { user });
  });
  await page.route('**/api/ngo/dashboard', (route) => reply(route, dashboard));
  await fillLogin(page);
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL(/\/ngo$/);
  expect(await storedToken(page)).toBe(token);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/ngo$/);
  await expect(page.locator('#role-dashboard')).toContainText('Welcome, Test Organization');
  await page.locator('[aria-controls="account-menu"]').click();
  await page.getByRole('button', { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await storedToken(page)).toBeNull();
  await page.goto('/ngo');
  await expect(page).toHaveURL(/\/login$/);
});

test('expired session is cleared after current-user 401', async ({ page }) => {
  await session(page);
  await page.route('**/api/auth/me', (route) => reply(route, {}, 401));
  await page.goto('/ngo');
  await expect(page).toHaveURL(/\/login$/);
  expect(await storedToken(page)).toBeNull();
});

test('browser offline mode shows network error and recovers after reconnect', async ({ page, context }) => {
  await page.route('**/api/auth/login', (route) => route.continue());
  await fillLogin(page);
  await context.setOffline(true);
  await page.locator('button[type=submit]').click();
  await expect(page.getByRole('alert')).toContainText('Unable to connect to the server');
  expect(await storedToken(page)).toBeNull();
  await context.setOffline(false);
  await page.route('**/api/auth/login', (route) => reply(route, { token, user }));
  await page.route('**/api/ngo/dashboard', (route) => reply(route, dashboard));
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL(/\/ngo$/);
});

for (const failure of ['network', '500', '401', '400']) {
  test(`login ${failure} shows a safe error and supports retry`, async ({ page }) => {
    let failed = true;
    const messages = {
      network: 'Unable to connect to the server. Check your connection and try again.',
      500: 'An error occurred while logging in. Please try again.',
      401: 'The email address or password is incorrect.',
      400: 'Please check your login information.',
    };
    await page.route('**/api/auth/login', (route) => {
      if (!failed) return reply(route, { token, user });
      return failure === 'network' ? route.abort('internetdisconnected')
        : route.fulfill({ status: Number(failure), json: { message: 'PRIVATE_INTERNAL_DETAIL' } });
    });
    await page.route('**/api/ngo/dashboard', (route) => reply(route, dashboard));
    await fillLogin(page);
    await page.locator('button[type=submit]').click();
    await expect(page.getByRole('alert')).toHaveText(messages[failure]);
    await expect(page.locator('body')).not.toContainText('PRIVATE_INTERNAL_DETAIL');
    await expect(page.locator('#email')).toHaveValue(credentials.email);
    await expect(page.locator('#password')).toHaveValue(credentials.password);
    await expect(page.locator('button[type=submit]')).toBeEnabled();
    expect(await storedToken(page)).toBeNull();
    failed = false;
    await page.locator('button[type=submit]').click();
    await expect(page).toHaveURL(/\/ngo$/);
  });
}

for (const status of ['PENDING', 'REJECTED']) {
  test(`${status} applicant stays signed out and status clears on edit`, async ({ page }) => {
    await page.route('**/api/auth/login', (route) => reply(route, {
      application: { status, request_type: 'DOCTOR', rejection_reason: 'License needs correction' },
    }, 403));
    await fillLogin(page);
    await page.locator('button[type=submit]').click();
    await expect(page.locator('section[aria-live=polite]')).toContainText(status === 'PENDING' ? 'Under review' : 'Not approved');
    if (status === 'REJECTED') await expect(page.getByText('License needs correction')).toBeVisible();
    expect(await storedToken(page)).toBeNull();
    await expect(page).toHaveURL(/\/login$/);
    await page.locator('#email').fill('another@hcms.test');
    await expect(page.locator('section[aria-live=polite]')).toHaveCount(0);
  });
}

for (const failure of ['network', '500']) {
  test(`dashboard ${failure} can retry without losing the session`, async ({ page }) => {
    await session(page);
    let failed = true;
    await page.route('**/api/ngo/dashboard', (route) => failed
      ? (failure === 'network' ? route.abort('internetdisconnected') : reply(route, {}, 500))
      : reply(route, dashboard));
    await page.goto('/ngo');
    const panel = page.locator('#role-dashboard');
    await expect(panel.getByRole('alert')).toContainText('The dashboard could not be loaded');
    expect(await storedToken(page)).toBe(token);
    failed = false;
    await panel.getByRole('button', { name: 'Try again' }).click();
    await expect(panel.getByRole('alert')).toHaveCount(0);
    await expect(panel.locator('dd')).toHaveText(['3', '7']);
  });

  test(`session restoration ${failure} denies access but retains token for recovery`, async ({ page }) => {
    await session(page);
    await page.route('**/api/auth/me', (route) => failure === 'network'
      ? route.abort('internetdisconnected') : reply(route, {}, 500));
    await page.goto('/ngo');
    await expect(page).toHaveURL(/\/login$/);
    expect(await storedToken(page)).toBe(token);
    await page.route('**/api/auth/me', (route) => reply(route, { user }));
    await page.goto('/ngo');
    await expect(page.locator('#role-dashboard')).toBeVisible();
  });
}

for (const role of ['patient', 'doctor', 'ngo']) {
  for (const failure of ['network', '500', '409']) {
    test(`${role} registration survives ${failure} and retries without creating a session`, async ({ page }) => {
      let failed = true;
      await page.route(`**/api/auth/register/${role}`, (route) => {
        expect(route.request().headers().authorization).toBeUndefined();
        if (!failed) return reply(route, {}, 201);
        return failure === 'network' ? route.abort('internetdisconnected') : reply(route, {}, Number(failure));
      });
      await page.goto(`/register/${role}`);
      const values = { full_name: 'Browser Test', email: credentials.email, password: credentials.password,
        password_confirmation: credentials.password,
        ...(role === 'patient' ? { national_id: '123456789', date_of_birth: '2000-01-01' }
          : role === 'doctor' ? { specialization: 'General Medicine', license_number: 'TEST-123' }
            : { organization_name: 'Test Organization' }),
      };
      for (const [name, value] of Object.entries(values)) await page.locator(`[name="${name}"]`).fill(value);
      if (role === 'patient') await page.locator('[name=gender]').selectOption('MALE');
      await page.locator('button[type=submit]').click();
      await expect(page.getByRole('alert')).toContainText(failure === 'network' ? 'Unable to connect'
        : failure === '500' ? 'The server could not' : /already/);
      for (const [name, value] of Object.entries(values)) await expect(page.locator(`[name="${name}"]`)).toHaveValue(value);
      await expect(page.locator('button[type=submit]')).toBeEnabled();
      expect(await storedToken(page)).toBeNull();
      failed = false;
      await page.locator('button[type=submit]').click();
      await expect(page.getByRole('status')).toContainText(role === 'patient' ? 'Your account is ready' : 'registration submitted');
      expect(await storedToken(page)).toBeNull();
    });
  }
}
