import type { Page, Route } from '@playwright/test';

/** E2E 전용 — 운영 DB에 의존하지 않는 공개 조직 목 데이터 */
export const MOCK_PUBLIC_ORG = {
  id: '00000000-0000-4000-8000-000000000001',
  name: '모아 테스트 피아노',
  industry_type: 'piano',
  public_code: 'PIANOQR1',
  slug: null,
  address: '서울시 테스트구 1',
  phone: '02-0000-0000',
  email: null,
  description: 'E2E 상담 QR 테스트용',
  business_hours: '월–금 10:00–20:00',
  representative_name: null,
  is_active: true,
} as const;

export type MockPublicOrgOptions = {
  /** null이면 조직 없음(빈 배열) */
  org?: typeof MOCK_PUBLIC_ORG | null;
  /** RPC 네트워크 오류 시뮬레이션 */
  failOrgLookup?: boolean;
};

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/**
 * 공개 상담/랜딩이 호출하는 Supabase RPC를 가로채 운영 데이터 의존을 제거한다.
 */
export async function mockPublicOrgApis(page: Page, options: MockPublicOrgOptions = {}) {
  const org = options.org === undefined ? MOCK_PUBLIC_ORG : options.org;
  const failOrgLookup = options.failOrgLookup === true;
  const capturedCodes: string[] = [];

  await page.route('**/rest/v1/rpc/get_public_organization_by_code', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204 });
      return;
    }
    if (failOrgLookup) {
      await fulfillJson(route, 500, { message: 'mock org lookup failed' });
      return;
    }
    try {
      const payload = route.request().postDataJSON() as { p_code?: string } | null;
      if (payload?.p_code) capturedCodes.push(String(payload.p_code));
    } catch {
      /* ignore parse errors */
    }
    await fulfillJson(route, 200, org ? [org] : []);
  });

  await page.route('**/rest/v1/rpc/list_bookable_schedules', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204 });
      return;
    }
    await fulfillJson(route, 200, []);
  });

  return {
    getCapturedCodes: () => [...capturedCodes],
  };
}

/** 비로그인 공개 페이지용 — 로컬 세션 제거 */
export async function clearBrowserAuth(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
}
