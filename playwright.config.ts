import { defineConfig, devices } from '@playwright/test';

// Claim-walks. Each truth/<slug>.spec.ts proves one project's claim against the live product,
// read-only, at both viewports. truth/report.ts turns the JSON report into results.json.
export default defineConfig({
  testDir: 'truth',
  outputDir: 'test-results',
  retries: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['json', { outputFile: 'truth/out/report.json' }], ['list']],
  use: {
    trace: 'off',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        screen: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
        userAgent: devices['Pixel 7'].userAgent,
      },
    },
  ],
});
