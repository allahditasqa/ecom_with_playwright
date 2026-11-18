import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';
import { env } from './src/config/env';

const isCI = !!process.env.CI;

// firefox / webkit are opt-in: ALL_BROWSERS=1 npx playwright test  (see npm run test:firefox / test:webkit)
const extraBrowsers = [
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
    dependencies: ['setup'],
    testIgnore: /setup\//,
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
    dependencies: ['setup'],
    testIgnore: /setup\//,
  },
];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  // Retries are only enabled on CI (the target is a shared public site and can hiccup).
  retries: isCI ? 2 : 0,
  workers: env.workers,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['./reporters/moduleReporter.ts'], // module-wise, timestamped, never-overwritten reports in reports/
  ],
  use: {
    baseURL: env.baseUrl,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    // 1) creates a shared user through the API, logs in once through the UI and stores the session
    { name: 'setup', testDir: './tests/setup', testMatch: /.*\.setup\.ts/, teardown: 'cleanup' },
    { name: 'cleanup', testDir: './tests/setup', testMatch: /.*\.teardown\.ts/ },
    // 2) UI + API suites. chromium is the default.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /setup\//,
    },
    ...(process.env.ALL_BROWSERS ? extraBrowsers : []),
  ],
});
