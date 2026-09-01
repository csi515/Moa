import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ARTIFACTS = '/opt/cursor/artifacts';
const BASE_URL = 'http://127.0.0.1:3000';
const SUPABASE_URL = 'https://xlsfnfolrrhxsxazmhjb.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc2ZuZm9scnJoeHN4YXptaGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MjUyMTcsImV4cCI6MjA5NzUwMTIxN30.YnH7dbzErljcYcMM1OJKeUNOs0CCJYHvGc0_QEEVTaY';
const EMAIL = 'cursor-desktop-test-45be@mailinator.com';
const PASSWORD = 'DesktopTest45be!';
const GYM_ORG_ID = 'cc4aac49-5980-49e1-8416-adcad865ba3a';
const STORAGE_KEY = 'sb-xlsfnfolrrhxsxazmhjb-auth-token';

const results = [];

function log(step, pass, detail = '') {
  results.push({ step, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${step}${detail ? ` — ${detail}` : ''}`);
}

async function getSession() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (error) throw error;
  return data.session;
}

async function main() {
  await mkdir(ARTIFACTS, { recursive: true });
  const session = await getSession();
  log('Supabase login', true, EMAIL);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  await context.addInitScript(
    ({ key, value, orgId }) => {
      localStorage.setItem(key, JSON.stringify(value));
      localStorage.setItem('moa_current_organization_id', orgId);
    },
    {
      key: STORAGE_KEY,
      value: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: session.user,
      },
      orgId: GYM_ORG_ID,
    }
  );

  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('response', (res) => {
    if (res.status() === 403) failedRequests.push(res.url());
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });

  // Hydration / dashboard
  await page.waitForTimeout(3000);
  const hasHydrateError = await page.getByText('다시 시도').isVisible().catch(() => false);
  log('Data hydration', !hasHydrateError, hasHydrateError ? 'hydrate error screen shown' : 'no error');

  const sidebarVisible = await page.locator('aside.hidden.md\\:flex, aside.md\\:flex').first().isVisible().catch(() => false);
  log('Desktop sidebar visible', sidebarVisible);

  const bottomNavVisible = await page.locator('nav.md\\:hidden.fixed.bottom-0').first().isVisible().catch(() => false);
  log('Mobile bottom nav hidden on desktop', !bottomNavVisible);

  await page.screenshot({ path: path.join(ARTIFACTS, 'gym_dashboard_desktop.png'), fullPage: true });

  // Navigate to students
  const studentsNav = page.locator('#nav-students, button:has-text("회원")').first();
  if (await studentsNav.isVisible().catch(() => false)) {
    await studentsNav.click();
  } else {
    await page.getByRole('button', { name: /회원/ }).first().click();
  }
  await page.waitForTimeout(2000);

  const tableVisible = await page.locator('.hidden.md\\:block table, .hidden.md\\:block').first().isVisible().catch(() => false);
  log('Desktop student table view', tableVisible);

  await page.waitForSelector('table >> text=김태권', { timeout: 15000 });
  const studentVisible = await page.locator('table').getByText('김태권', { exact: true }).isVisible();
  log('Synced student 김태권 visible', studentVisible);

  const shuttleVisible = await page.getByText('셔틀', { exact: true }).first().isVisible();
  log('Shuttle badge visible', shuttleVisible);

  await page.screenshot({ path: path.join(ARTIFACTS, 'gym_students_desktop.png'), fullPage: true });

  if (studentVisible) {
    await page.locator('table').getByText('김태권', { exact: true }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ARTIFACTS, 'gym_student_detail_desktop.png'), fullPage: true });
    const pickupVisible = await page.getByText('픽업·하원 셔틀').isVisible();
    log('Student detail shows pickup info', pickupVisible);
    await page.getByRole('button', { name: '닫기' }).click();
    await page.waitForTimeout(500);
  }

  // Switch org via UI switcher, then open daycare dashboard
  await page.getByRole('button', { name: /테스트 태권도장/ }).click();
  await page.getByRole('button', { name: /테스트 어린이집/ }).click();
  await page.waitForTimeout(4000);
  await page.locator('#nav-dashboard').click();
  await page.waitForTimeout(1500);

  const daycareHydrateError = await page.getByText('다시 시도').isVisible().catch(() => false);
  log('Daycare hydration', !daycareHydrateError);

  const daycareTitle = await page.getByText('어린이집 대시보드').isVisible().catch(() => false);
  log('Daycare dashboard title', daycareTitle);

  const daycareSidebar = await page.locator('aside').first().isVisible().catch(() => false);
  log('Daycare desktop sidebar', daycareSidebar);

  await page.screenshot({ path: path.join(ARTIFACTS, 'daycare_dashboard_desktop.png'), fullPage: true });

  const journalsNav = page.locator('#nav-journals');
  if (await journalsNav.isVisible().catch(() => false)) {
    await journalsNav.click();
    await page.waitForTimeout(1500);
    const journalsPage = await page.getByText('알림장', { exact: true }).first().isVisible();
    log('Daycare journals page loads', journalsPage);
    await page.screenshot({ path: path.join(ARTIFACTS, 'daycare_journals_desktop.png'), fullPage: true });
  }

  const piano403 = failedRequests.filter((u) => u.includes('/piano/'));
  log('Piano schema 403s (non-blocking)', piano403.length <= 20, `${piano403.length} requests`);

  const criticalConsoleErrors = consoleErrors.filter(
    (e) => !e.includes('favicon') && !e.includes('DevTools') && !e.includes('403')
  );
  log('No critical console errors', criticalConsoleErrors.length === 0, criticalConsoleErrors.slice(0, 3).join(' | '));

  await writeFile(path.join(ARTIFACTS, 'desktop_test_results.json'), JSON.stringify(results, null, 2));
  await browser.close();

  const failed = results.filter((r) => !r.pass);
  if (failed.length > 0) {
    console.error('\nFailed steps:', failed);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
