import type { Page, Route } from '@playwright/test';

/**
 * 원장 홈 StorageHydrator가 부르는 core/piano REST GET을 가로채
 * Incomplete hydrate 화면("데이터를 불러오지 못했습니다")을 막는다.
 * Auth·멤버십 RPC·쓰기는 실서버로 통과시킨다.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*',
} as const;

/** coreEntityHydrate 목록 GET — 실패 시 빈 배열로 성공 처리 */
const CORE_HYDRATE_LISTS = new Set([
  'staff',
  'customers',
  'customer_contacts',
  'services',
  'schedules',
  'payments',
  'payment_transactions',
  'expenses',
  'income_entries',
  'teacher_payroll_settlements',
  'consultations',
  'notifications',
  'attendance_sessions',
  'parent_student_links',
  'session_passes',
]);

const FALLBACK_ORG = {
  settings: {},
  name: 'E2E 학원',
  industry_type: 'piano',
};

function restResource(url: URL): string {
  const parts = url.pathname.split('/').filter(Boolean);
  const restIdx = parts.indexOf('v1');
  return parts[restIdx + 1] || '';
}

function schemaProfile(headers: Record<string, string>): string {
  return (headers['accept-profile'] || headers['content-profile'] || 'core').toLowerCase();
}

function wantsSingle(headers: Record<string, string>): boolean {
  return (headers.accept || '').includes('vnd.pgrst.object');
}

async function fulfillJson(
  route: Route,
  status: number,
  body: unknown,
  extraHeaders?: Record<string, string>
) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: { ...CORS, ...extraHeaders },
    body: body === undefined ? '' : JSON.stringify(body),
  });
}

async function fulfillEmptyList(route: Route) {
  await fulfillJson(route, 200, [], { 'Content-Range': '*/0' });
}

function isRestUrl(url: URL) {
  return url.pathname.includes('/rest/v1/');
}

/**
 * 로그인 전 page.route 등록. 같은 page에 두 번 호출해도 핸들러가 겹쳐 이행한다.
 */
export async function mockDirectorHydrate(page: Page) {
  await page.route(isRestUrl, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }

    const headers = req.headers();
    const profile = schemaProfile(headers);
    const url = new URL(req.url());
    const resource = restResource(url);

    if (resource === 'rpc') {
      await route.continue();
      return;
    }

    // piano 스키마(원장 hydrate + education) GET은 항상 빈 목록 성공
    if (req.method() === 'GET' && (profile === 'piano' || profile === 'education')) {
      await fulfillEmptyList(route);
      return;
    }

    if (req.method() !== 'GET') {
      await route.continue();
      return;
    }

    try {
      const response = await route.fetch();
      if (response.ok()) {
        await route.fulfill({ response });
        return;
      }

      if (CORE_HYDRATE_LISTS.has(resource) && !wantsSingle(headers)) {
        await fulfillEmptyList(route);
        return;
      }

      if (resource === 'organizations' && wantsSingle(headers)) {
        await fulfillJson(route, 200, FALLBACK_ORG, { 'Content-Range': '0-0/1' });
        return;
      }

      await route.fulfill({ response });
    } catch {
      if (CORE_HYDRATE_LISTS.has(resource) && !wantsSingle(headers)) {
        await fulfillEmptyList(route);
        return;
      }
      if (resource === 'organizations' && wantsSingle(headers)) {
        await fulfillJson(route, 200, FALLBACK_ORG, { 'Content-Range': '0-0/1' });
        return;
      }
      await route.continue();
    }
  });
}
