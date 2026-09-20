import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** 사이드바/하단 내비로 탭 이동 (데스크톱·모바일 겸용) */
export async function openNavTab(page: Page, label: string) {
  // 데스크톱 사이드바
  const side = page.getByRole('button', { name: label, exact: true }).first();
  if (await side.isVisible().catch(() => false)) {
    await side.click();
    return;
  }
  // 모바일 하단
  const bottom = page.locator('nav, [role="navigation"]').getByText(label, { exact: true }).first();
  if (await bottom.isVisible().catch(() => false)) {
    await bottom.click();
    return;
  }
  // 더보기
  const more = page.getByRole('button', { name: /더보기/ }).first();
  if (await more.isVisible().catch(() => false)) {
    await more.click();
    await page.getByRole('button', { name: label, exact: true }).first().click();
    return;
  }
  throw new Error(`내비에서 "${label}" 탭을 찾지 못함 (piano/config/nav.tsx)`);
}

export async function expectHomeVisible(page: Page) {
  await expect(page.getByRole('heading', { name: /안녕하세요/ })).toBeVisible({ timeout: 30_000 });
}

export async function openFinanceArea(page: Page, area: '수납' | '재무 관리') {
  await openNavTab(page, '수납·재무');
  await expect(page.getByRole('heading', { name: '수납·재무' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('tab', { name: new RegExp(area) }).click();
}

export async function openFinanceSegment(page: Page, segment: '수납' | '미납' | '수입' | '지출' | '정산') {
  await page
    .getByRole('tablist', { name: /수납 메뉴|재무 관리 메뉴/ })
    .getByRole('tab', { name: segment, exact: true })
    .click();
}
