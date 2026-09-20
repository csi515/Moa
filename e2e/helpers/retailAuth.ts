import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { RETAIL_E2E } from './mockRetailBackend';
import { openNavTab } from './directorNav';

/** Retail 사업장 소유자 로그인 (목 Auth) */
export async function loginAsRetailOwner(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '로그인', exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.getByPlaceholder('예: name@example.com').fill(RETAIL_E2E.owner.email);
  await page.getByPlaceholder('비밀번호').fill(RETAIL_E2E.owner.password);
  await page.getByRole('button', { name: '이메일로 로그인' }).click();

  // 사업장 선택 또는 Retail 홈 (단일 멤버십은 자동 선택)
  // heading 우선 — 홈 헤딩과 요약 문구가 동시에 존재해 .or() strict 위반 방지
  const ready = page
    .getByRole('heading', { name: '홈' })
    .or(page.getByRole('heading', { name: '사업장 선택' }))
    .or(page.getByRole('button', { name: '다시 시도' }))
    .first();
  await expect(ready).toBeVisible({ timeout: 60_000 });

  if (await page.getByRole('button', { name: '다시 시도' }).isVisible().catch(() => false)) {
    throw new Error(
      'Storage hydrate 실패(Incomplete hydrate). mockRetailBackend REST 가로채기를 확인하세요.'
    );
  }

  if (await page.getByRole('heading', { name: '사업장 선택' }).isVisible().catch(() => false)) {
    await page.getByRole('button', { name: new RegExp(RETAIL_E2E.orgName, 'i') }).first().click();
  }

  await expect(page.getByRole('heading', { name: '홈' }).first()).toBeVisible({
    timeout: 60_000,
  });
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

  await expect(page.getByRole('heading', { name: '내 사업장' }).or(page.getByText('내 사업장'))).toBeVisible({
    timeout: 60_000,
  });
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
