import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { getE2ECredentials } from './env';

/** 로그인 폼 표시 확인 (자격 증명 불필요) */
export async function expectAuthPageVisible(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '로그인', exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByPlaceholder('예: name@example.com')).toBeVisible();
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

  await page.goto('/');
  await expect(page.getByRole('button', { name: '로그인', exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });

  const emailField = page.getByPlaceholder('예: name@example.com');
  const passwordField = page.getByPlaceholder('비밀번호');
  await emailField.fill(creds.email);
  await passwordField.fill(creds.password);
  await page.getByRole('button', { name: '이메일로 로그인' }).click();

  // 조직 선택 또는 홈
  const orgHeading = page.getByRole('heading', { name: '사업장 선택' });
  const homeGreeting = page.getByRole('heading', { name: /안녕하세요/ });
  await expect(orgHeading.or(homeGreeting)).toBeVisible({ timeout: 60_000 });

  if (await orgHeading.isVisible().catch(() => false)) {
    if (creds.orgNameHint) {
      const match = page.getByRole('button', { name: new RegExp(creds.orgNameHint, 'i') }).first();
      if (await match.isVisible().catch(() => false)) {
        await match.click();
      } else {
        await page.locator('button').filter({ hasText: /학원|피아노|선택|입장/ }).first().click();
      }
    } else {
      // 첫 사업장 카드 버튼
      const orgButtons = page.locator('button').filter({ hasText: /.+/ });
      const count = await orgButtons.count();
      if (count === 0) {
        throw new Error(
          '사업장 선택 화면에 선택 가능한 조직이 없습니다. (OrganizationSelector.tsx)'
        );
      }
      // "새 사업장" 등이 아닌 실제 조직 — 첫 번째 큰 카드
      await page.locator('button').nth(0).click();
    }
    await expect(homeGreeting.or(page.getByRole('navigation'))).toBeVisible({ timeout: 60_000 });
  }
}
