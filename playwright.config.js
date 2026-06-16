import { defineConfig, devices } from '@playwright/test';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'https://www.saucedemo.com', // ← แก้ตรงนี้
    headless: true,   // ← false = เห็นหน้าต่าง browser
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})