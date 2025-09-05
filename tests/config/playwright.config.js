// Playwright configuration for testing the collaborative football system
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid parallel conflicts
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5500',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Slow down actions for better visibility during development
    slowMo: process.env.SLOW_MO ? 100 : 0,
    
    // Default timeout for actions
    actionTimeout: 10000,
    
    // Browser context options
    contextOptions: {
      ignoreHTTPSErrors: true,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Run local server before starting tests
  webServer: {
    command: 'npx http-server . -p 5500',
    port: 5500,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});