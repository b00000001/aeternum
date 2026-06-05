import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173?test',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: './node_modules/.bin/vite --host 0.0.0.0 --port 5173',
    port: 5173,
    reuseExistingServer: true,
    timeout: 10000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
