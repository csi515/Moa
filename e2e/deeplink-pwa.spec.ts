import { test, expect } from '@playwright/test';

test.describe('Deep link bootstrap', () => {
  test('guardian link is stored then stripped from URL', async ({ page }) => {
    await page.goto('/?link=TESTCODE99');
    await expect(page.locator('body')).toBeVisible();

    // bootstrapWebDeepLinks가 sessionStorage에 저장 후 URL에서 제거
    const pending = await page.evaluate(() =>
      sessionStorage.getItem('moa_pending_guardian_link')
    );
    expect(pending?.toUpperCase()).toBe('TESTCODE99');
    await expect(page).not.toHaveURL(/link=TESTCODE99/i);
  });

  test('staff_link is stored then stripped from URL', async ({ page }) => {
    await page.goto('/?staff_link=STAFF001');
    await expect(page.locator('body')).toBeVisible();

    const pending = await page.evaluate(() =>
      sessionStorage.getItem('moa_pending_staff_link')
    );
    expect(pending?.toUpperCase()).toBe('STAFF001');
    await expect(page).not.toHaveURL(/staff_link=STAFF001/i);
  });
});

test.describe('PWA assets', () => {
  test('manifest is reachable', async ({ request }) => {
    const res = await request.get('/manifest.json');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.name || json.short_name).toBeTruthy();
  });

  test('service worker script is reachable', async ({ request }) => {
    const res = await request.get('/sw.js');
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text.length).toBeGreaterThan(20);
  });
});
