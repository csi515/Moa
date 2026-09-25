import { defineConfig, devices } from '@playwright/test';

/**
 * 딥링크·PWA 스모크 E2E
 * 실행: npx playwright test
 * 사전: npm run build && npx vite preview --port 4173 (또는 webServer가 기동)
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    // PWA SW가 /rest·/auth GET을 가로채면 page.route 목이 우회됨
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
