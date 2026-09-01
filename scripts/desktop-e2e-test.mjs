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
const STORAGE_KEY = 'sb-xlsfnfolrrhxsxazmhjb-auth-token';

/** 업종별 테스트 설정 */
const INDUSTRIES = [
  {
    id: 'piano',
    orgId: '44c9336c-2e83-4319-9c3b-ae3fa77614ff',
    orgName: '테스트 피아노학원',
    dashboardText: '오늘의 학원 브리핑',
    featureNav: '#nav-curriculum',
    featureText: '커리큘럼·진도 관리',
    customerNav: '#nav-students',
    customerLabel: '원생',
    pickupExpected: false,
  },
  {
    id: 'pilates',
    orgId: 'e1b6a498-40ec-4213-86f5-aa1f1f0016ec',
    orgName: '테스트 필라테스',
    dashboardText: '필라테스 스튜디오 대시보드',
    featureNav: '#nav-bookings',
    featureText: '예약',
    customerNav: '#nav-members',
    customerLabel: '회원',
    pickupExpected: true,
  },
  {
    id: 'gym',
    orgId: 'cc4aac49-5980-49e1-8416-adcad865ba3a',
    orgName: '테스트 태권도장',
    dashboardText: '체육관 대시보드',
    featureNav: '#nav-attendance',
    featureText: '출입 관리',
    customerNav: '#nav-students',
    customerLabel: '회원',
    pickupExpected: true,
    hasShuttleStudent: true,
  },
  {
    id: 'daycare',
    orgId: 'f1179911-5e4f-48c4-86ab-0ccfcf216555',
    orgName: '테스트 어린이집',
    dashboardText: '어린이집 대시보드',
    featureNav: '#nav-journals',
    featureText: '알림장',
    customerNav: '#nav-students',
    customerLabel: '원아',
    pickupExpected: true,
  },
];

const results = [];

function log(step, pass, detail = '') {
  results.push({ step, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${step}${detail ? ` — ${detail}` : ''}`);
}

function prefix(industry, step) {
  return `[${industry}] ${step}`;
}

async function getSession() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (error) throw error;
  return data.session;
}

async function loadOrg(page, session, orgId) {
  if (!page.url().startsWith(BASE_URL)) {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  await page.evaluate(
    ({ key, value, orgId: id }) => {
      localStorage.setItem(key, JSON.stringify(value));
      localStorage.setItem('moa_current_organization_id', id);
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
      orgId,
    }
  );
  await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3500);
}

async function testIndustry(page, session, config, consoleErrors) {
  const { id, orgId, orgName, dashboardText, featureNav, featureText, customerNav, customerLabel, pickupExpected, hasShuttleStudent } = config;

  await loadOrg(page, session, orgId);

  const hydrateError = await page.getByText('다시 시도').isVisible().catch(() => false);
  log(prefix(id, 'hydrate'), !hydrateError);

  const sidebarVisible = await page.locator('aside').first().isVisible().catch(() => false);
  log(prefix(id, 'desktop sidebar'), sidebarVisible);

  const bottomNavHidden = !(await page.locator('nav.md\\:hidden.fixed.bottom-0').first().isVisible().catch(() => false));
  log(prefix(id, 'bottom nav hidden'), bottomNavHidden);

  const orgInHeader = await page.getByRole('button', { name: new RegExp(orgName) }).isVisible().catch(() => false);
  log(prefix(id, 'org header'), orgInHeader, orgName);

  const dashboardOk = await page.getByText(dashboardText).first().isVisible().catch(() => false);
  log(prefix(id, 'dashboard'), dashboardOk, dashboardText);

  await page.screenshot({ path: path.join(ARTIFACTS, `${id}_dashboard_desktop.png`), fullPage: true });

  const nav = page.locator(featureNav);
  if (await nav.isVisible().catch(() => false)) {
    await nav.click();
    await page.waitForTimeout(1500);
    const featureOk = await page.getByText(featureText, { exact: true }).first().isVisible().catch(() => false);
    log(prefix(id, 'feature page'), featureOk, featureText);
    await page.screenshot({ path: path.join(ARTIFACTS, `${id}_feature_desktop.png`), fullPage: true });
  } else {
    log(prefix(id, 'feature nav'), false, featureNav);
  }

  const customerNavEl = page.locator(customerNav);
  if (await customerNavEl.isVisible().catch(() => false)) {
    await customerNavEl.click();
    await page.waitForTimeout(1500);
    const customerPage = await page.getByText(new RegExp(`${customerLabel} 관리`)).first().isVisible().catch(() => false);
    log(prefix(id, 'customer list'), customerPage, `${customerLabel} 관리`);
    await page.screenshot({ path: path.join(ARTIFACTS, `${id}_customers_desktop.png`), fullPage: true });

    if (hasShuttleStudent) {
      const shuttleBadge = await page.getByText('셔틀', { exact: true }).first().isVisible().catch(() => false);
      log(prefix(id, 'shuttle badge'), shuttleBadge);
    }

    if (pickupExpected) {
      const shuttleFilter = (await page.locator('select option', { hasText: '셔틀 전체' }).count()) > 0;
      log(prefix(id, 'shuttle filter option'), shuttleFilter);
    } else {
      const noShuttleFilter = (await page.locator('select option', { hasText: '셔틀 전체' }).count()) === 0;
      log(prefix(id, 'no shuttle filter (piano)'), noShuttleFilter);
    }
  } else {
    log(prefix(id, 'customer nav'), false, customerNav);
  }

  const industryErrors = consoleErrors.filter(
    (e) =>
      !e.includes('favicon') &&
      !e.includes('DevTools') &&
      !e.includes('403') &&
      !e.includes('409') &&
      (e.includes('Failed to load') || e.includes('permission denied') || e.includes('42501'))
  );
  log(prefix(id, 'no sync errors'), industryErrors.length === 0, industryErrors.slice(-2).join(' | '));
}

async function main() {
  await mkdir(ARTIFACTS, { recursive: true });
  const session = await getSession();
  log('Supabase login', true, EMAIL);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  for (const config of INDUSTRIES) {
    consoleErrors.length = 0;
    await testIndustry(page, session, config, consoleErrors);
    console.log('');
  }

  await writeFile(path.join(ARTIFACTS, 'industry_desktop_test_results.json'), JSON.stringify(results, null, 2));
  await browser.close();

  const failed = results.filter((r) => !r.pass);
  if (failed.length > 0) {
    console.error('\nFailed steps:', failed);
    process.exit(1);
  }
  console.log(`\nAll ${INDUSTRIES.length} industries passed (${results.length} checks).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
