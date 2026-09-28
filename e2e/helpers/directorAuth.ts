import type { Page, Response } from '@playwright/test';
import { expect } from '@playwright/test';
import { getE2ECredentials } from './env';
import { seedE2eBlockingUiDismissed, suppressE2eBlockingUi } from './e2eUiState';

/** 로그인 폼 표시 확인 (자격 증명 불필요) */
export async function expectAuthPageVisible(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '로그인', exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByPlaceholder('예: name@example.com')).toBeVisible();
}

const ORG_PICKER_EXCLUDE = /뒤로|새 사업장|이용자로 가입|직원·강사|다시 시도/;

async function dismissCreateOrganizationWizard(page: Page) {
  const wizard = page.getByRole('heading', { name: '새 사업장 등록' });
  if (!(await wizard.isVisible().catch(() => false))) return;
  const cancel = page.getByLabel('취소').or(page.getByRole('button', { name: '취소' }));
  if (await cancel.first().isVisible().catch(() => false)) {
    await cancel.first().click();
  }
}

/** PWA 설치 안내가 로그인 직후 클릭을 가로채는 경우 (특히 WebKit) */
export async function dismissPwaInstallPrompt(page: Page) {
  const dialog = page.getByRole('dialog').filter({ hasText: /홈 화면에 추가/ });
  for (let i = 0; i < 8; i++) {
    if (!(await dialog.first().isVisible().catch(() => false))) return;
    const close = dialog
      .getByRole('button', { name: '나중에' })
      .or(dialog.getByRole('button', { name: '닫기' }))
      .or(dialog.getByRole('button', { name: '확인했어요' }));
    if (await close.first().isVisible().catch(() => false)) {
      await close.first().click({ force: true });
    }
    await dialog.first().waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => undefined);
  }
}

/** 피아노 온보딩 모달이 홈을 가리면 닫는다 (주소 구조화 이후에도 동일 헤딩) */
async function dismissOnboardingOverlays(page: Page) {
  const wizard = page.getByRole('heading', { name: '학원 초기 설정' });
  if (await wizard.isVisible().catch(() => false)) {
    const later = page.getByLabel('나중에 이어서');
    if (await later.isVisible().catch(() => false)) {
      await later.click();
    }
  }

  const skip = page.getByRole('button', { name: '건너뛰기' });
  if (await skip.first().isVisible().catch(() => false)) {
    await skip.first().click();
  }
}

async function pickOrganizationFromSelector(page: Page, orgNameHint: string | null) {
  const heading = page.getByRole('heading', { name: '사업장 선택' });
  if (!(await heading.isVisible().catch(() => false))) return;

  await dismissCreateOrganizationWizard(page);

  const retry = page.getByRole('button', { name: '다시 시도' });
  if (await retry.isVisible().catch(() => false)) {
    await retry.click();
    await expect(heading).toBeVisible({ timeout: 30_000 });
  }

  const hinted = orgNameHint
    ? page.getByRole('button', { name: new RegExp(orgNameHint, 'i') }).first()
    : null;
  if (hinted && (await hinted.isVisible().catch(() => false))) {
    await hinted.click();
    return;
  }

  const orgCard = page
    .getByRole('button')
    .filter({ hasNotText: ORG_PICKER_EXCLUDE })
    .filter({ hasText: /.+/ })
    .first();

  if (!(await orgCard.isVisible().catch(() => false))) {
    throw new Error(
      '사업장 선택 화면에 선택 가능한 조직이 없습니다. (OrganizationSelector.tsx)'
    );
  }
  await orgCard.click();
}

function directorHomeReady(page: Page) {
  return page
    .getByRole('heading', { name: /안녕하세요/ })
    .or(page.getByRole('heading', { name: '오늘 일정', exact: true }))
    .or(page.getByRole('heading', { name: '오늘 출결', exact: true }));
}

async function waitForDirectorHome(page: Page) {
  await dismissPwaInstallPrompt(page);
  await dismissOnboardingOverlays(page);
  await expect(directorHomeReady(page).first()).toBeVisible({ timeout: 60_000 });
  await dismissPwaInstallPrompt(page);
  await dismissOnboardingOverlays(page);
}

/** FAB가 하단 결제/입고 버튼을 가로채지 않게 한다 */
export async function muteMobileOverlayClicks(page: Page) {
  await page.addStyleTag({
    content:
      'div.mobile-overlay-bottom.pointer-events-auto { pointer-events: none !important; }',
  });
}

async function failIfLoginErrorVisible(page: Page) {
  const banner = page.locator('.text-rose-700, .text-rose-800').filter({ visible: true }).first();
  if (!(await banner.isVisible().catch(() => false))) return;
  const text = ((await banner.textContent()) || '').trim();
  if (!text) return;
  throw new Error(`원장 로그인 실패: ${text}`);
}

function isAuthTokenResponse(res: Response) {
  return res.url().includes('/auth/v1/token') && res.request().method() === 'POST';
}

/**
 * 이메일/비밀번호로 로그인 후 원장 앱(조직 선택 또는 홈)까지 진입.
 * 자격 증명 없으면 throw — skip 처리하지 말고 호출부에서 hasE2ECredentials로 분기.
 * 실제 Supabase 세션을 쓰며, 토큰 응답/로그인 오류는 60초 대기 전에 실패한다.
 */
export async function loginAsDirector(page: Page) {
  const creds = getE2ECredentials();
  if (!creds) {
    throw new Error(
      'E2E_EMAIL / E2E_PASSWORD 미설정. 원장 로그인 E2E는 실제 Supabase 계정이 필요합니다. (e2e/helpers/env.ts)'
    );
  }

  await suppressE2eBlockingUi(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: '로그인', exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });

  await page.getByPlaceholder('예: name@example.com').fill(creds.email);
  await page.getByPlaceholder('비밀번호').fill(creds.password);

  const tokenWait = page.waitForResponse(isAuthTokenResponse, { timeout: 20_000 });
  await page.getByRole('button', { name: '이메일로 로그인' }).click();

  const tokenRes = await tokenWait.catch(() => null);
  if (!tokenRes) {
    await failIfLoginErrorVisible(page);
    throw new Error(
      'Supabase /auth/v1/token 응답이 없습니다. 빌드에 VITE_SUPABASE_URL이 포함됐는지, E2E_EMAIL/E2E_PASSWORD가 전달됐는지 확인하세요.'
    );
  }
  if (!tokenRes.ok()) {
    await failIfLoginErrorVisible(page);
    throw new Error(
      `Supabase 로그인 HTTP ${tokenRes.status()}. E2E_EMAIL/E2E_PASSWORD 계정을 확인하세요.`
    );
  }

  const orgHeading = page.getByRole('heading', { name: '사업장 선택' });
  const homeReady = directorHomeReady(page);
  const onboarding = page.getByRole('heading', { name: '학원 초기 설정' });
  await expect(orgHeading.or(homeReady).or(onboarding).first()).toBeVisible({ timeout: 60_000 });
  await failIfLoginErrorVisible(page);
  await dismissPwaInstallPrompt(page);

  if (await orgHeading.isVisible().catch(() => false)) {
    await pickOrganizationFromSelector(page, creds.orgNameHint);
  }

  await waitForDirectorHome(page);
  await seedE2eBlockingUiDismissed(page);
  await muteMobileOverlayClicks(page);
}
