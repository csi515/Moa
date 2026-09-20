import { test, expect } from '@playwright/test';
import {
  MOCK_PUBLIC_ORG,
  clearBrowserAuth,
  mockPublicOrgApis,
} from './helpers/mockPublicOrgApi';

/**
 * 피아노학원 상담 신청 QR → /c/:code/consultation 공개 페이지 회귀
 * Supabase RPC는 page.route로 목킹 (운영 DB 비의존)
 */
test.describe('Public consultation QR flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserAuth(page);
  });

  test('비로그인 상태에서 상담 URL에 접근할 수 있다', async ({ page }) => {
    await mockPublicOrgApis(page);

    await page.goto(`/c/${MOCK_PUBLIC_ORG.public_code}/consultation`);

    await expect(page).toHaveURL(
      new RegExp(`/c/${MOCK_PUBLIC_ORG.public_code}/consultation`, 'i')
    );
    await expect(page.getByText('로그인', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /회원가입|회원 가입/ })).toHaveCount(0);
  });

  test('공개 상담 페이지가 흰 화면 없이 렌더링된다', async ({ page }) => {
    await mockPublicOrgApis(page);

    await page.goto(`/c/${MOCK_PUBLIC_ORG.public_code}/consultation`);

    await expect(page.getByRole('heading', { name: MOCK_PUBLIC_ORG.name })).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: /^상담 신청$/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: '상담 문의' })).toBeVisible();
    await expect(page.getByRole('button', { name: '상담 신청' })).toBeVisible();

    const bodyText = (await page.locator('body').innerText()).trim();
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test('조직 식별 실패 시 오류 화면이 표시되고 흰 화면이 아니다', async ({ page }) => {
    await mockPublicOrgApis(page, { org: null });

    await page.goto('/c/UNKNOWN99/consultation');

    await expect(page.getByRole('heading', { name: '조직을 찾을 수 없습니다' })).toBeVisible();
    await expect(page.getByRole('button', { name: '홈으로 돌아가기' })).toBeVisible();

    const bodyText = (await page.locator('body').innerText()).trim();
    expect(bodyText.length).toBeGreaterThan(10);
    await expect(page.getByRole('heading', { name: MOCK_PUBLIC_ORG.name })).toHaveCount(0);
  });

  test('조직 조회 RPC 오류여도 흰 화면 없이 오류 UI를 보여준다', async ({ page }) => {
    await mockPublicOrgApis(page, { failOrgLookup: true });

    await page.goto(`/c/${MOCK_PUBLIC_ORG.public_code}/consultation`);

    await expect(page.getByRole('heading', { name: '조직을 찾을 수 없습니다' })).toBeVisible();
    await expect(page.getByText('조직 정보를 가져오는데 실패했습니다')).toBeVisible();
    const bodyText = (await page.locator('body').innerText()).trim();
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('로그인·회원가입을 강제하지 않는다', async ({ page }) => {
    await mockPublicOrgApis(page);

    await page.goto(`/c/${MOCK_PUBLIC_ORG.public_code}/consultation`);

    await expect(page.getByRole('heading', { name: '상담 문의' })).toBeVisible();
    await expect(page.getByPlaceholder('이름', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('010-0000-0000', { exact: true })).toBeVisible();

    // 상담 모드에서는 가입/연결 CTA가 숨겨짐
    await expect(page.getByRole('button', { name: /성인 수강생 · 회원 가입/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /학부모 · 우리 아이/ })).toHaveCount(0);

    await expect(page).toHaveURL(/\/c\/PIANOQR1\/consultation/i);
    await expect(page).not.toHaveURL(/signup|login|auth/i);
  });

  test('올바른 public code가 들어간 상담 URL이 정상적으로 초기화된다', async ({ page }) => {
    const api = await mockPublicOrgApis(page);
    const codeInUrl = 'pianoqr1';

    await page.goto(`/c/${codeInUrl}/consultation`);

    await expect(page.getByRole('heading', { name: MOCK_PUBLIC_ORG.name })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('paragraph').filter({ hasText: /^상담 신청$/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: '상담 문의' })).toBeVisible();
    await expect(page.getByText('희망 날짜 · 시간')).toBeVisible();

    await expect.poll(() => api.getCapturedCodes().length).toBeGreaterThan(0);
    expect(api.getCapturedCodes()[0]).toBe('PIANOQR1');
    await expect(page).toHaveURL(new RegExp(`/c/${codeInUrl}/consultation`, 'i'));
  });
});
