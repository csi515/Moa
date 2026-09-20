import { test, expect, type Page, type Browser } from '@playwright/test';
import { hasE2ECredentials } from './helpers/env';
import { expectAuthPageVisible, loginAsDirector } from './helpers/directorAuth';
import {
  expectHomeVisible,
  openFinanceArea,
  openFinanceSegment,
  openNavTab,
} from './helpers/directorNav';
import { findStudentByName, snapshotAttendance } from './helpers/storageProbe';

/**
 * 피아노 원장 핵심 운영 흐름 E2E
 * 인증: E2E_EMAIL + E2E_PASSWORD (선택 E2E_ORG_NAME)
 * 실행: npx playwright test e2e/director-ops-flow.spec.ts
 */

const STUDENT_NAME = `E2E학생${Date.now().toString().slice(-6)}`;
const canAuth = hasE2ECredentials();
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

  test.beforeAll(async ({ browser: b }) => {
    test.skip(
      !canAuth,
      'E2E_EMAIL/E2E_PASSWORD 미설정 — 원장 로그인 이후 흐름은 실행 불가 (e2e/helpers/env.ts)'
    );
    browser = b;
    page = await browser.newPage();
    await loginAsDirector(page);
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test('1~2. 홈 진입', async () => {
    await openNavTab(page, '홈').catch(() => undefined);
    await expectHomeVisible(page);
    await expect(page.getByText('오늘 일정').or(page.getByText('오늘 출결'))).toBeVisible();
  });

  test('3~4. 학생 등록 · 목록 · 자동 반 미배정', async () => {
    await openNavTab(page, '학생');
    await expect(page.getByRole('button', { name: '학생 등록' }).first()).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole('button', { name: '학생 등록' }).first().click();
    await expect(page.getByRole('heading', { name: '신규 학생 등록' })).toBeVisible();

    await page.getByText(/성인 학생/).click();
    await page.locator('input[autocomplete="name"]').first().fill(STUDENT_NAME);

    await page.locator('form').getByRole('button', { name: '학생 등록' }).click();

    await expect(
      page.getByText(new RegExp(`${STUDENT_NAME}|등록되었습니다|시간표에 배치`))
    ).toBeVisible({ timeout: 30_000 });

    const closeBtn = page.getByRole('button', { name: '닫기' }).or(page.getByLabel('닫기'));
    if (await closeBtn.first().isVisible().catch(() => false)) {
      await closeBtn.first().click();
    }
    const later = page.getByRole('button', { name: /나중에|닫기|확인/ });
    if (await later.first().isVisible().catch(() => false)) {
      await later.first().click();
    }

    await openNavTab(page, '학생');
    await expect(page.getByText(STUDENT_NAME).first()).toBeVisible({ timeout: 20_000 });

    const saved = await findStudentByName(page, STUDENT_NAME);
    expect(saved, 'piano_app_students에 학생 없음').not.toBeNull();
    expect(saved!.classIds, '신규 학생 자동 반 배정 금지 (StudentFormModal classIds:[])').toEqual(
      []
    );
  });

  test('5~7. 시간표 30분 배치·이동 · 출결 미변경', async () => {
    const attendanceBefore = await snapshotAttendance(page);

    await page.setViewportSize(MOBILE_VIEWPORT);
    await openNavTab(page, '일정');
    await expect(page.getByText(/시간표|30분 단위/)).toBeVisible({ timeout: 20_000 });

    const dayKo = ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()];
    const dayBtn = page.getByRole('button', { name: `${dayKo}요일` });
    if (await dayBtn.isVisible().catch(() => false)) {
      await dayBtn.click();
    }

    const unplaced = page.getByRole('button', { name: new RegExp(STUDENT_NAME) });
    if (await unplaced.first().isVisible().catch(() => false)) {
      await unplaced.first().click();
      const slotBlock = page
        .locator('*')
        .filter({ hasText: '15:30' })
        .filter({ has: page.getByRole('button', { name: /여기에 배치|학생 추가/ }) })
        .first();
      await expect(slotBlock).toBeVisible({ timeout: 15_000 });
      await slotBlock.getByRole('button', { name: /여기에 배치|학생 추가/ }).click();
    } else {
      const slotBlock = page
        .locator('*')
        .filter({ hasText: '15:30' })
        .filter({ has: page.getByRole('button', { name: /학생 추가/ }) })
        .first();
      await expect(slotBlock).toBeVisible({ timeout: 15_000 });
      await slotBlock.getByRole('button', { name: '학생 추가' }).click();
      await page.getByText(STUDENT_NAME).first().click();
    }

    const confirmBtn = page.getByRole('button', { name: /반 만들고 배치|확인/ });
    if (await confirmBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.first().click();
    }

    await expect
      .poll(async () => (await findStudentByName(page, STUDENT_NAME))?.classIds.length ?? 0, {
        timeout: 25_000,
      })
      .toBeGreaterThan(0);

    expect(await snapshotAttendance(page)).toBe(attendanceBefore);

    await page.getByRole('button', { name: new RegExp(STUDENT_NAME) }).first().click();
    const slot1600 = page
      .locator('*')
      .filter({ hasText: '16:00' })
      .filter({ has: page.getByRole('button', { name: /여기에 배치/ }) })
      .first();
    await slot1600.getByRole('button', { name: /여기에 배치/ }).click();
    if (await confirmBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.first().click();
    }

    expect(await snapshotAttendance(page)).toBe(attendanceBefore);
  });

  test('8~10. 출결 · 오늘 예정 · 등원', async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openNavTab(page, '출결');
    await expect(page.getByRole('heading', { name: '출결' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/오늘 예정|예정/)).toBeVisible();

    const row = page.locator('li, div, article, tr').filter({ hasText: STUDENT_NAME }).first();
    await expect(row, {
      message: `오늘 예정에 ${STUDENT_NAME} 없음 — 배치 요일이 오늘이 아니거나 배치 실패 (PianoAttendanceView.tsx)`,
    }).toBeVisible({ timeout: 15_000 });

    await row.getByRole('button', { name: '등원' }).click();
    await expect(row.getByText(/등원|출석|완료/).or(page.getByText(/등원 처리/))).toBeVisible({
      timeout: 15_000,
    });
  });

  test('11. 상담 화면', async () => {
    await openNavTab(page, '상담');
    await expect(page.getByRole('heading', { name: '상담' })).toBeVisible({ timeout: 20_000 });
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

    await loginAsDirector(page);
    await openNavTab(page, '학생');
    const addBtn = page.getByRole('button', { name: '학생 등록' }).first();
    await expect(addBtn).toBeVisible({ timeout: 20_000 });
    const box = await addBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(40);

    await openNavTab(page, '수납·재무');
    await expect(page.getByRole('tab', { name: /수납/ }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /재무 관리/ })).toBeVisible();
  });
});
