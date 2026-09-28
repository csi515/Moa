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

/** 이미 처리됐거나 페이지가 닫혀 응답할 수 없는 route 오류만 무시한다 (그 외 오류는 그대로 던짐) */
async function settleRoute(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/already handled|has been closed|Target closed|has been disposed/i.test(msg)) return;
    throw err;
  }
}

function isRestUrl(url: URL) {
  return url.pathname.includes('/rest/v1/');
}

const mockedPages = new WeakSet<Page>();

/**
 * 로그인 전 page.route 등록. 같은 page에 여러 번 호출해도(스펙 + loginAsDirector) 한 번만 등록한다.
 */
export async function mockDirectorHydrate(page: Page) {
  if (mockedPages.has(page)) return;
  mockedPages.add(page);
  await page.route(isRestUrl, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      await settleRoute(() => route.fulfill({ status: 204, headers: CORS }));
      return;
    }

    const headers = req.headers();
    const profile = schemaProfile(headers);
    const url = new URL(req.url());
    const resource = restResource(url);

    if (resource === 'rpc') {
      await settleRoute(() => route.continue());
      return;
    }

    // piano 스키마(원장 hydrate + education) GET은 항상 빈 목록 성공
    if (req.method() === 'GET' && (profile === 'piano' || profile === 'education')) {
      await settleRoute(() => fulfillEmptyList(route));
      return;
    }

    if (req.method() !== 'GET') {
      await settleRoute(() => route.continue());
      return;
    }

    // route.fetch 실패(네트워크)만 대체 응답으로 처리한다. fulfill 도중 예외(페이지 종료 등)를
    // catch 에서 다시 continue 하면 "Route is already handled!" 로 테스트가 실패하므로 분리한다.
    let response: Awaited<ReturnType<Route['fetch']>> | null = null;
    try {
      response = await route.fetch();
    } catch {
      response = null;
    }

    await settleRoute(async () => {
      if (response?.ok()) {
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
      if (response) await route.fulfill({ response });
      else await route.continue();
    });
  });
}
