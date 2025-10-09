import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Expo Web e2e tests
 *
 * Tests run against the Expo web build with Chrome DevTools Protocol (CDP)
 * for advanced debugging and MCP integration.
 */

const PORT = process.env.PORT || 8081;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Retry failed tests
  retries: process.env.CI ? 2 : 0,

  // Parallel execution
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  use: {
    // Base URL for all tests
    baseURL,

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording
    video: 'retain-on-failure',

    // Browser context options
    viewport: { width: 375, height: 667 }, // iPhone SE viewport

    // Geolocation and permissions (for camera/mic tests)
    permissions: ['camera', 'microphone'],

    // Timeout for actions
    actionTimeout: 10 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Mobile viewports for responsive testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run Expo web server before tests
  webServer: {
    command: 'npm run web:dev',
    port: Number(PORT),
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
