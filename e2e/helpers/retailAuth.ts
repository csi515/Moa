import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { RETAIL_E2E } from './mockRetailBackend';
import { openNavTab } from './directorNav';
import { dismissPwaInstallPrompt, muteMobileOverlayClicks } from './directorAuth';

/** Retail 사업장 소유자 로그인 (목 Auth) */
export async function loginAsRetailOwner(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '로그인', exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.getByPlaceholder('예: name@example.com').fill(RETAIL_E2E.owner.email);
  await page.getByPlaceholder('비밀번호').fill(RETAIL_E2E.owner.password);
  await page.getByRole('button', { name: '이메일로 로그인' }).click();

  const homeHeading = page.getByRole('heading', { name: '홈', exact: true });
  const orgHeading = page.getByRole('heading', { name: '사업장 선택', exact: true });
  const retry = page.getByRole('button', { name: '다시 시도' });

  await expect(homeHeading.or(orgHeading).or(retry).or(page.getByRole('dialog')).first()).toBeVisible({
    timeout: 60_000,
  });
  await dismissPwaInstallPrompt(page);

  if (await retry.isVisible().catch(() => false)) {
    throw new Error(
      'Storage hydrate 실패(Incomplete hydrate). mockRetailBackend REST 가로채기를 확인하세요.'
    );
  }

  const orgCard = page
    .getByRole('button', { name: new RegExp(RETAIL_E2E.orgName, 'i') })
    .filter({ hasNotText: /홈으로|뒤로/ })
    .first();
  if (
    (await orgHeading.isVisible().catch(() => false)) &&
    !(await homeHeading.isVisible().catch(() => false)) &&
    (await orgCard.isVisible().catch(() => false))
  ) {
    await orgCard.click({ force: true });
  }

  await dismissPwaInstallPrompt(page);
  await expect(homeHeading).toBeVisible({ timeout: 60_000 });
  await dismissPwaInstallPrompt(page);
  await muteMobileOverlayClicks(page);
}

/** 일반 사용자(Customer) 로그인 — 고객 포털 */
export async function loginAsRetailCustomerUser(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '로그인', exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.getByPlaceholder('예: name@example.com').fill(RETAIL_E2E.customerUser.email);
  await page.getByPlaceholder('비밀번호').fill(RETAIL_E2E.customerUser.password);
  await page.getByRole('button', { name: '이메일로 로그인' }).click();

  await dismissPwaInstallPrompt(page);
  await expect(
    page.getByRole('heading', { name: '내 사업장' }).or(page.getByText('내 사업장')).first()
  ).toBeVisible({
    timeout: 60_000,
  });
  await dismissPwaInstallPrompt(page);
  await muteMobileOverlayClicks(page);
}

export async function openRetailTab(page: Page, label: string) {
  await openNavTab(page, label);
}

/** 모달 내 라벨 옆 입력 (FormField는 htmlFor 미연결) */
export function fieldInput(page: Page, label: string) {
  return page.locator('label').filter({ hasText: label }).locator('..').locator('input, select, textarea').first();
}

/** 모바일/데스크탑 중복 노드 중 보이는 텍스트 */
export function visibleText(page: Page, text: string | RegExp) {
  return page.getByText(text).filter({ visible: true }).first();
}
