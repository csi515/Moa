import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { dismissPwaInstallPrompt } from './directorAuth';

const BLOCKING_OVERLAY_TEXT = /홈 화면에 추가|학원 초기 설정|초기 설정을 건너뛸까요/;
const BLOCKING_DISMISS_NAME = /^(나중에|닫기|확인했어요|건너뛰기)$/;

/** PWA·온보딩 등 z-50 전체 화면 모달이 내비 클릭을 가로채지 않게 닫는다 */
export async function dismissBlockingOverlays(page: Page) {
  await dismissPwaInstallPrompt(page);

  const overlay = page
    .locator('div.fixed.inset-0')
    .filter({ hasText: BLOCKING_OVERLAY_TEXT })
    .filter({ has: page.getByRole('button', { name: BLOCKING_DISMISS_NAME }) })
    .first();

  if (!(await overlay.isVisible().catch(() => false))) return;

  const dismiss = overlay.getByRole('button', { name: BLOCKING_DISMISS_NAME }).first();
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click({ force: true });
  }
  await overlay.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => undefined);
}

async function clickNavControl(page: Page, locator: ReturnType<Page['locator']>) {
  await dismissBlockingOverlays(page);
  try {
    await locator.click({ timeout: 5_000 });
  } catch {
    await dismissBlockingOverlays(page);
    await locator.click({ force: true, timeout: 5_000 });
  }
}

/** 사이드바/하단 내비로 탭 이동 (데스크톱·모바일 겸용) */
export async function openNavTab(page: Page, label: string) {
  await dismissBlockingOverlays(page);
  // 데스크톱 사이드바
  const side = page.getByRole('button', { name: label, exact: true }).first();
  if (await side.isVisible().catch(() => false)) {
    await clickNavControl(page, side);
    return;
  }
  // 모바일 하단
  const bottom = page.locator('nav, [role="navigation"]').getByText(label, { exact: true }).first();
  if (await bottom.isVisible().catch(() => false)) {
    await clickNavControl(page, bottom);
    return;
  }
  // 더보기 시트 (사이드바 동일 라벨은 뷰포트 밖일 수 있음)
  const more = page.getByRole('button', { name: /더보기/ }).first();
  if (await more.isVisible().catch(() => false)) {
    await clickNavControl(page, more);
    const sheetItem = page
      .locator('div.fixed.inset-0')
      .getByRole('button', { name: label, exact: true })
      .filter({ visible: true })
      .first();
    await expect(sheetItem).toBeVisible({ timeout: 8_000 });
    await dismissBlockingOverlays(page);
    await sheetItem.scrollIntoViewIfNeeded();
    await sheetItem.evaluate((el) => (el as HTMLButtonElement).click());
    return;
  }
  throw new Error(`내비에서 "${label}" 탭을 찾지 못함 (piano/config/nav.tsx)`);
}

export async function expectHomeVisible(page: Page) {
  await expect(page.getByRole('heading', { name: /안녕하세요/ })).toBeVisible({ timeout: 30_000 });
}

export async function openFinanceArea(page: Page, area: '수납' | '재무 관리') {
  await openNavTab(page, '수납·재무');
  await dismissBlockingOverlays(page);
  await expect(page.getByRole('heading', { name: '수납·재무' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('tab', { name: new RegExp(area) }).click();
}

export async function openFinanceSegment(page: Page, segment: '수납' | '미납' | '수입' | '지출' | '정산') {
  await page
    .getByRole('tablist', { name: /수납 메뉴|재무 관리 메뉴/ })
    .getByRole('tab', { name: segment, exact: true })
    .click();
}
