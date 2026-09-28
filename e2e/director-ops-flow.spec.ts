import { test, expect, type Page, type Browser } from '@playwright/test';
import { hasE2ECredentials } from './helpers/env';
import { expectAuthPageVisible, loginAsDirector } from './helpers/directorAuth';
import {
  expectHomeVisible,
  openFinanceArea,
  openFinanceSegment,
  openNavTab,
} from './helpers/directorNav';
import { suppressE2eBlockingUi } from './helpers/e2eUiState';
import { mockDirectorHydrate } from './helpers/mockDirectorHydrate';
import { findStudentByName, snapshotAttendance } from './helpers/storageProbe';

/**
 * 피아노 원장 핵심 운영 흐름 E2E
 * 인증: E2E_EMAIL + E2E_PASSWORD (선택 E2E_ORG_NAME)
 * 쓰기 단계(3~10: 학생 등록·시간표 배치·등원)는 E2E_ALLOW_WRITES=1 일 때만 실행한다.
 *   로그인한 사업장에 학생·반·출결 데이터가 실제로 남기 때문 (정리 단계 없음).
 *   로컬/스테이징 Supabase 에서만 켠다. 운영 사업장을 가리키는 CI 계정에서는 켜지 않는다.
 * 실행: E2E_ALLOW_WRITES=1 npx playwright test e2e/director-ops-flow.spec.ts
 */

const STUDENT_NAME = `E2E학생${Date.now().toString().slice(-6)}`;
const canAuth = hasE2ECredentials();
const allowWrites = /^(1|true|yes)$/i.test((process.env.E2E_ALLOW_WRITES || '').trim());
const WRITE_SKIP_REASON =
  'E2E_ALLOW_WRITES 미설정 — 학생 등록·시간표 배치·등원은 로그인한 사업장에 실제 데이터를 남긴다 ' +
  '(로컬/스테이징에서 E2E_ALLOW_WRITES=1 로 실행)';

/** 모바일 시간표 목록의 시간대 행 (예: 15:30). locator('*').filter(hasText) 는 <html> 부터 잡혀 모든 버튼이 걸린다 */
function slotRow(page: Page, time: string) {
  return page.getByRole('listitem').filter({ has: page.getByText(time, { exact: true }) });
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

async function isSlotEmpty(page: Page, time: string): Promise<boolean> {
  const row = slotRow(page, time);
  if ((await row.count()) === 0) return false;
  return (await row.getByText('비어 있는 시간대').count()) > 0;
}

/**
 * 배치할 칸(start)과 이동할 칸(start+60분)을 고른다. 레슨(기본 50분)끼리 연습실·강사 충돌이 나지 않도록
 * start-30 ~ start+90 이 모두 비어 있는 첫 구간. 프로젝트별 시작 시각을 달리해 병렬 실행끼리 겹치지 않게 한다.
 */
async function pickEmptySlots(page: Page, from: string): Promise<{ start: string; target: string }> {
  for (let start = from; start <= '19:00'; start = addMinutes(start, 30)) {
    const window = [-30, 0, 30, 60, 90].map((d) => addMinutes(start, d));
    let free = true;
    for (const t of window) {
      if (!(await isSlotEmpty(page, t))) {
        free = false;
        break;
      }
    }
    if (free) return { start, target: addMinutes(start, 60) };
  }
  throw new Error(`오늘 ${from} 이후 비어 있는 시간대 구간이 없습니다 (이전 실행 데이터 정리 필요)`);
}

const SLOT_WINDOW_START: Record<string, string> = {
  chromium: '15:00',
  'mobile-chrome': '16:30',
  'mobile-safari': '18:00',
};
const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.describe('Auth gate (자격 증명 불필요)', () => {
  test('로그인 화면이 렌더링된다', async ({ page }) => {
    await expectAuthPageVisible(page);
    await expect(page.getByRole('button', { name: '이메일로 로그인' })).toBeVisible();
  });
});

test.describe('원장 핵심 운영 흐름 (인증 필요)', () => {
  test.describe.configure({ mode: 'serial' });

  let browser: Browser;
  let page: Page;
  let slotFrom = '15:00';
  let placedAt = '';

  test.beforeAll(async ({ browser: b }, testInfo) => {
    slotFrom = SLOT_WINDOW_START[testInfo.project.name] ?? '15:00';
    test.skip(
      !canAuth,
      'E2E_EMAIL/E2E_PASSWORD 미설정 — 원장 로그인 이후 흐름은 실행 불가 (e2e/helpers/env.ts)'
    );
    browser = b;
    page = await browser.newPage();
    await suppressE2eBlockingUi(page);
    await mockDirectorHydrate(page);
    await loginAsDirector(page);
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test('1~2. 홈 진입', async () => {
    await openNavTab(page, '홈').catch(() => undefined);
    await expectHomeVisible(page);
    await expect(
      page
        .getByRole('heading', { name: '오늘 일정', exact: true })
        .or(page.getByRole('heading', { name: '오늘 출결', exact: true }))
        .first()
    ).toBeVisible();
  });

  test('3~4. 학생 등록 · 목록 · 자동 반 미배정', async () => {
    test.skip(!allowWrites, WRITE_SKIP_REASON);
    await openNavTab(page, '학생');
    await expect(page.getByRole('button', { name: '학생 등록' }).first()).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole('button', { name: '학생 등록' }).first().click();
    await expect(page.getByRole('heading', { name: '신규 학생 등록' })).toBeVisible();

    await page.getByText(/성인 학생/).click();
    await page.locator('input[autocomplete="name"]').first().fill(STUDENT_NAME);

    // 제출 버튼은 Modal footer(폼 밖)에 있고 form="student-form" 속성으로 폼에 연결된다 (StudentFormModal)
    const studentDialog = page.getByRole('dialog').filter({ hasText: '신규 학생 등록' });
    await studentDialog.getByRole('button', { name: '학생 등록', exact: true }).click();

    // 목록 행은 저장 중에도 먼저 그려지므로(낙관적 반영) 저장 완료 안내(StudentFormPostSave)를 기다린다
    await expect(studentDialog.getByText(`${STUDENT_NAME} 등록 완료`)).toBeVisible({
      timeout: 30_000,
    });

    const closeBtn = page.getByRole('button', { name: '닫기' }).or(page.getByLabel('닫기'));
    if (await closeBtn.first().isVisible().catch(() => false)) {
      await closeBtn.first().click();
    }
    const later = page.getByRole('button', { name: /나중에|닫기|확인/ });
    if (await later.first().isVisible().catch(() => false)) {
      await later.first().click();
    }

    await openNavTab(page, '학생');
    // 모바일은 데스크톱 표가 숨겨진 채 DOM 에 남아 있으므로 보이는 항목만
    await expect(page.getByText(STUDENT_NAME).filter({ visible: true }).first()).toBeVisible({
      timeout: 20_000,
    });

    const saved = await findStudentByName(page, STUDENT_NAME);
    expect(saved, 'piano_app_students에 학생 없음').not.toBeNull();
    expect(saved!.classIds, '신규 학생 자동 반 배정 금지 (StudentFormModal classIds:[])').toEqual(
      []
    );
  });

  test('5~7. 시간표 30분 배치·이동 · 출결 미변경', async () => {
    test.skip(!allowWrites, WRITE_SKIP_REASON);
    const attendanceBefore = await snapshotAttendance(page);

    await page.setViewportSize(MOBILE_VIEWPORT);
    await openNavTab(page, '일정');
    await expect(page.getByRole('heading', { name: '시간표', level: 2 })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText('30분 단위').first()).toBeVisible();

    const dayKo = ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()];
    const dayBtn = page.getByRole('button', { name: `${dayKo}요일` });
    if (await dayBtn.isVisible().catch(() => false)) {
      await dayBtn.click();
    }
    await expect(slotRow(page, '15:00')).toBeVisible({ timeout: 15_000 });

    const { start, target } = await pickEmptySlots(page, slotFrom);
    const confirmBtn = page.getByRole('button', { name: /반 만들고 (배치|이동)|확인/ });

    const unplaced = page.getByRole('button', { name: new RegExp(STUDENT_NAME) });
    if (await unplaced.first().isVisible().catch(() => false)) {
      await unplaced.first().click();
      await slotRow(page, start).getByRole('button', { name: /여기에 배치|학생 추가/ }).first().click();
    } else {
      await slotRow(page, start).getByRole('button', { name: '학생 추가' }).click();
      await page
        .getByRole('button', { name: new RegExp(`${STUDENT_NAME} 학생`) })
        .first()
        .click();
    }
    if (await confirmBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.first().click();
    }

    await expect
      .poll(async () => (await findStudentByName(page, STUDENT_NAME))?.classIds.length ?? 0, {
        timeout: 25_000,
      })
      .toBeGreaterThan(0);
    await expect(
      slotRow(page, start).getByRole('button', { name: new RegExp(STUDENT_NAME) })
    ).toBeVisible();
    expect(await snapshotAttendance(page)).toBe(attendanceBefore);

    // 이동: 배치된 학생을 탭한 뒤 target 칸의 「여기에 배치」
    await slotRow(page, start).getByRole('button', { name: new RegExp(STUDENT_NAME) }).click();
    await slotRow(page, target).getByRole('button', { name: /여기에 배치/ }).click();
    if (await confirmBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.first().click();
    }
    await expect(
      slotRow(page, target).getByRole('button', { name: new RegExp(STUDENT_NAME) })
    ).toBeVisible({ timeout: 15_000 });
    placedAt = target;

    expect(await snapshotAttendance(page)).toBe(attendanceBefore);
  });

  test('8~10. 출결 · 오늘 예정 · 등원', async () => {
    test.skip(!allowWrites, WRITE_SKIP_REASON);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openNavTab(page, '출결');
    await expect(page.getByRole('heading', { name: '출결' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: '오늘 예정' })).toBeVisible();

    const row = page.getByRole('listitem').filter({ hasText: STUDENT_NAME }).first();
    await expect(row, {
      message: `오늘 예정에 ${STUDENT_NAME}(${placedAt}) 없음 — 배치 요일이 오늘이 아니거나 배치 실패 (PianoAttendanceView.tsx)`,
    }).toBeVisible({ timeout: 15_000 });
    await expect(row.getByText('미등원', { exact: true })).toBeVisible();

    await row.getByRole('button', { name: '등원', exact: true }).click();
    // 행의 상태 표시가 「미등원」→「등원」(버튼이 아닌 상태 라벨, STATUS_META.present)
    await expect(
      row.getByText('등원', { exact: true }).and(page.locator(':not(button)'))
    ).toBeVisible({ timeout: 15_000 });
    await expect(row.getByText('미등원', { exact: true })).toHaveCount(0);
  });

  test('11. 상담 화면', async () => {
    await openNavTab(page, '상담');
    await expect(page.getByRole('heading', { name: '상담', exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole('tablist', { name: '상담 업무' })).toBeVisible();
  });

  test('12~14. 수납·재무 · 미납 · 정산', async () => {
    await openFinanceArea(page, '수납');
    await openFinanceSegment(page, '미납');
    await expect(page.getByText(/미납|총 미납액/).first()).toBeVisible({ timeout: 20_000 });

    await openFinanceArea(page, '재무 관리');
    await openFinanceSegment(page, '정산');
    await expect(page.getByText(/강사 정산|정산 월|정산 확정/).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('홈 → 출결 섹션 이동', async () => {
    await openNavTab(page, '홈');
    await expectHomeVisible(page);
    const link = page.getByRole('button', { name: '출결 전체' });
    await expect(link, {
      message: 'DirectorTodayAttendanceSection.tsx 「출결 전체」 버튼 없음',
    }).toBeVisible({ timeout: 10_000 });
    await link.click();
    await expect(page.getByRole('heading', { name: '출결' })).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('모바일 viewport', () => {
  test('핵심 버튼이 보인다', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    if (!canAuth) {
      await expectAuthPageVisible(page);
      const loginBtn = page.getByRole('button', { name: '이메일로 로그인' });
      await expect(loginBtn).toBeVisible();
      const box = await loginBtn.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      return;
    }

    await suppressE2eBlockingUi(page);
    await mockDirectorHydrate(page);
    await loginAsDirector(page);
    await expectHomeVisible(page);
    await openNavTab(page, '학생');
    const addBtn = page.getByRole('button', { name: '학생 등록' }).filter({ visible: true }).first();
    await expect(addBtn).toBeVisible({ timeout: 20_000 });
    const box = await addBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(40);

    await openNavTab(page, '수납·재무');
    await expect(page.getByRole('tab', { name: /수납/ }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /재무 관리/ })).toBeVisible();
  });
});
