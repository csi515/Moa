import type { Page, Response } from '@playwright/test';
import { expect } from '@playwright/test';
import { getE2ECredentials } from './env';
import { seedE2eBlockingUiDismissed, suppressE2eBlockingUi } from './e2eUiState';
import { mockDirectorHydrate } from './mockDirectorHydrate';

const ORG_PICKER_EXCLUDE = /뒤로|새 사업장|이용자로 가입|직원·강사|다시 시도/;
const POST_LOGIN_TIMEOUT_MS = 30_000;

/** 로그인 폼 표시 확인 (자격 증명 불필요) */
export async function expectAuthPageVisible(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '로그인', exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByPlaceholder('예: name@example.com')).toBeVisible();
}

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

/** 피아노 온보딩 모달이 홈을 가리면 닫는다 */
async function dismissOnboardingOverlays(page: Page) {
  const wizard = page.getByTestId('onboarding-wizard');
  for (let i = 0; i < 6; i++) {
    const skipConfirm = page.getByRole('button', { name: '건너뛰기', exact: true });
    if (await skipConfirm.first().isVisible().catch(() => false)) {
      await skipConfirm.first().click({ force: true });
      await skipConfirm.first().waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => undefined);
    }

    if (!(await wizard.isVisible().catch(() => false))) {
      return;
    }

    const dismiss = page
      .getByTestId('onboarding-dismiss')
      .or(page.getByLabel('나중에 이어서'))
      .or(wizard.getByRole('button', { name: /나중에|닫기/ }));
    if (await dismiss.first().isVisible().catch(() => false)) {
      await dismiss.first().click({ force: true });
    }
    await wizard.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => undefined);
  }

  if (await wizard.isVisible().catch(() => false)) {
    throw new Error('온보딩 오버레이(onboarding-wizard)를 닫지 못했습니다.');
  }
}

async function pickOrganizationFromSelector(page: Page, orgNameHint: string | null) {
  const selector = page.getByTestId('organization-selector');
  if (!(await selector.isVisible().catch(() => false))) return;

  await dismissCreateOrganizationWizard(page);

  const retry = page.getByRole('button', { name: '다시 시도' });
  if (await retry.isVisible().catch(() => false)) {
    await retry.click();
    await expect(selector).toBeVisible({ timeout: 30_000 });
  }

  const options = selector.getByTestId('organization-option');
  const hinted = orgNameHint
    ? options.filter({ hasText: new RegExp(orgNameHint, 'i') }).first()
    : null;
  if (hinted && (await hinted.isVisible().catch(() => false))) {
    await hinted.click();
    await selector.waitFor({ state: 'hidden', timeout: POST_LOGIN_TIMEOUT_MS }).catch(() => undefined);
    return;
  }

  const orgCard = options
    .first()
    .or(
      selector
        .getByRole('button')
        .filter({ hasNotText: ORG_PICKER_EXCLUDE })
        .filter({ hasText: /.+/ })
        .first()
    );

  if (!(await orgCard.isVisible().catch(() => false))) {
    throw new Error(
      '사업장 선택 화면에 선택 가능한 조직이 없습니다. (OrganizationSelector.tsx)'
    );
  }
  await orgCard.click();
  await selector.waitFor({ state: 'hidden', timeout: POST_LOGIN_TIMEOUT_MS }).catch(() => undefined);
}

function directorAppReady(page: Page) {
  return page
    .getByTestId('director-home')
    .or(page.getByTestId('staff-home'))
    .or(page.getByTestId('app-work-main'));
}

async function failIfLoginErrorVisible(page: Page) {
  const banner = page.getByTestId('auth-login-error');
  if (!(await banner.isVisible().catch(() => false))) return;
  const text = ((await banner.textContent()) || '').trim();
  throw new Error(`원장 로그인 실패: ${text || '알 수 없는 오류'}`);
}

async function failIfHydrateErrorVisible(page: Page) {
  const hydrate = page.getByTestId('storage-hydrate-error');
  if (!(await hydrate.isVisible().catch(() => false))) return;
  const text = ((await hydrate.textContent()) || '').trim();
  throw new Error(`원장 홈 hydrate 실패: ${text || '데이터를 불러오지 못했습니다'}`);
}

function isAuthTokenResponse(res: Response) {
  return res.url().includes('/auth/v1/token') && res.request().method() === 'POST';
}

async function waitForAuthTokenOrFailLogin(page: Page, tokenWait: Promise<Response>) {
  let tokenRes: Response | null = null;
  let tokenSettled = false;
  const pending = tokenWait
    .then((res) => {
      tokenRes = res;
      tokenSettled = true;
      return res;
    })
    .catch(() => {
      tokenSettled = true;
      return null;
    });

  const deadline = Date.now() + 20_000;
  while (!tokenSettled && Date.now() < deadline) {
    await failIfLoginErrorVisible(page);
    await Promise.race([pending, page.waitForTimeout(250)]);
  }
  await failIfLoginErrorVisible(page);
  if (!tokenSettled) {
    await pending;
  }
  return tokenRes;
}

async function waitForAuthSessionStored(page: Page) {
  await page.waitForFunction(
    () => {
      try {
        for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i) || '';
          if (key.includes('-auth-token') || key.includes('supabase.auth')) {
            const raw = localStorage.getItem(key) || '';
            return raw.includes('access_token') || raw.includes('authenticated');
          }
        }
      } catch {
        return false;
      }
      return false;
    },
    null,
    { timeout: 20_000 }
  );
}

async function waitForDirectorHome(page: Page, orgNameHint: string | null) {
  const home = directorAppReady(page);
  const selector = page.getByTestId('organization-selector');
  const loading = page
    .getByTestId('app-loading')
    .or(page.getByTestId('organization-selector-loading'));
  const deadline = Date.now() + POST_LOGIN_TIMEOUT_MS * 2;

  while (Date.now() < deadline) {
    await failIfLoginErrorVisible(page);
    await failIfHydrateErrorVisible(page);
    await dismissPwaInstallPrompt(page);
    await dismissOnboardingOverlays(page);

    if (await home.first().isVisible().catch(() => false)) {
      break;
    }

    if (await selector.isVisible().catch(() => false)) {
      await pickOrganizationFromSelector(page, orgNameHint);
      continue;
    }

    await home
      .or(selector)
      .or(loading)
      .first()
      .waitFor({ state: 'visible', timeout: 2_000 })
      .catch(() => undefined);
  }

  await dismissPwaInstallPrompt(page);
  await dismissOnboardingOverlays(page);
  await failIfHydrateErrorVisible(page);
  await expect(page.getByTestId('onboarding-wizard')).toBeHidden();
  await expect(home.first()).toBeVisible({ timeout: 15_000 });
}

/**
 * 이메일/비밀번호로 로그인 후 원장 앱(조직 선택 또는 홈)까지 진입.
 * 자격 증명 없으면 throw — skip 처리하지 말고 호출부에서 hasE2ECredentials로 분기.
 */
export async function loginAsDirector(page: Page) {
  const creds = getE2ECredentials();
  if (!creds) {
    throw new Error(
      'E2E_EMAIL / E2E_PASSWORD 미설정. 원장 로그인 E2E는 실제 Supabase 계정이 필요합니다. (e2e/helpers/env.ts)'
    );
  }

  await suppressE2eBlockingUi(page);
  await mockDirectorHydrate(page);
  await page.goto('/');
  await expect(page.getByTestId('auth-page')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByPlaceholder('예: name@example.com')).toBeVisible();

  await page.getByPlaceholder('예: name@example.com').fill(creds.email);
  await page.getByPlaceholder('비밀번호').fill(creds.password);

  const tokenWait = page.waitForResponse(isAuthTokenResponse, { timeout: 20_000 });
  await page.getByRole('button', { name: '이메일로 로그인' }).click();

  const tokenRes = await waitForAuthTokenOrFailLogin(page, tokenWait);
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

  await failIfLoginErrorVisible(page);
  await waitForAuthSessionStored(page);

  // SPA는 path가 / 로 남을 수 있음 — 로그인 셸이 내려가는 것을 리다이렉션 대기로 본다
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15_000,
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId('auth-page')).toBeHidden({ timeout: POST_LOGIN_TIMEOUT_MS });
  await failIfLoginErrorVisible(page);

  const postLogin = page
    .getByTestId('organization-selector')
    .or(page.getByTestId('organization-selector-loading'))
    .or(page.getByTestId('app-loading'))
    .or(directorAppReady(page))
    .or(page.getByTestId('onboarding-wizard'))
    .or(page.getByTestId('storage-hydrate-error'));
  await expect(postLogin.first()).toBeVisible({ timeout: POST_LOGIN_TIMEOUT_MS });
  await failIfLoginErrorVisible(page);
  await failIfHydrateErrorVisible(page);

  await waitForDirectorHome(page, creds.orgNameHint);
  await seedE2eBlockingUiDismissed(page);
  await muteMobileOverlayClicks(page);
}

/** FAB가 하단 결제/입고 버튼을 가로채지 않게 한다 */
export async function muteMobileOverlayClicks(page: Page) {
  await page.addStyleTag({
    content:
      'div.mobile-overlay-bottom.pointer-events-auto { pointer-events: none !important; }',
  });
}
