//import { defineConfig, devices } from '@playwright/test';
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'https://www.saucedemo.com', // ← แก้ตรงนี้
    headless: true,   // ← false = เห็นหน้าต่าง browser
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // launchOptions: {
    //   slowMo: 800,
    // },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})