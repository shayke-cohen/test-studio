const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
  },
  webServer: {
    command: 'PORT=3001 npm start',
    port: 3001,
    reuseExistingServer: false,
    timeout: 10000,
  },
});
