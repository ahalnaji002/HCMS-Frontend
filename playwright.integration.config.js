import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

const apiBaseUrl = process.env.HCMS_API_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests/integration',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 120_000,
  use: {
    ...devices['Desktop Chrome'],
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chromium',
    baseURL: 'http://127.0.0.1:4179',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4179 --strictPort',
    url: 'http://127.0.0.1:4179',
    env: { VITE_API_URL: apiBaseUrl },
    reuseExistingServer: false,
  },
});
