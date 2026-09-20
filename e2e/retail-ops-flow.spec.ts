import { test, expect, type Page } from '@playwright/test';
import {
  clearBrowserAuth,
  mockRetailBackend,
  type MockRetailApi,
  RETAIL_E2E,
} from './helpers/mockRetailBackend';
import {
  fieldInput,
  loginAsRetailCustomerUser,
  loginAsRetailOwner,
  openRetailTab,
  visibleText,
} from './helpers/retailAuth';
import { expectAuthPageVisible } from './helpers/directorAuth';

/**
 * Retail 핵심 운영 흐름 E2E
 * - Auth/REST는 page.route 인메모리 목 (운영 DB 비의존)
 * - 실행: npx playwright test e2e/retail-ops-flow.spec.ts
 * - 사전: npm run build (VITE_SUPABASE_* 가 빌드에 포함되어야 앱 기동)
 */

const PRODUCT_NAME = `E2E상품${Date.now().toString().slice(-6)}`;
const CUSTOMER_NAME = `E2E고객${Date.now().toString().slice(-6)}`;
const PRODUCT_PRICE = 10_000;
const INBOUND_QTY = 10;
const SALE_QTY = 1;
/** 적립률 1% → floor(10000 * 1 / 100) = 100 */
const EXPECTED_EARN_POINTS = 100;

test.describe('Auth gate (자격 증명·목 불필요)', () => {
  test('로그인 화면이 렌더링된다', async ({ page }) => {
    await expectAuthPageVisible(page);
    await expect(page.getByRole('button', { name: '이메일로 로그인' })).toBeVisible();
  });
});

test.describe('Retail 핵심 운영 흐름 (목 백엔드)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let api: MockRetailApi;
  let productId = '';
  let customerId = '';

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);
    // PWA SW가 GET /rest 를 가로채면 page.route 목이 우회됨 — 공유 context에서 SW 차단
    const context = await browser.newContext({ serviceWorkers: 'block' });
    page = await context.newPage();
    await clearBrowserAuth(page);
    api = await mockRetailBackend(page);
    await loginAsRetailOwner(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('1. Retail 사업장 접근', async () => {
    await expect(page.getByText(RETAIL_E2E.orgName).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: '판매', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '상품', exact: true }).first()).toBeVisible();
  });

  test('2~3. 상품 등록 · 목록 확인', async () => {
    test.setTimeout(90_000);
    await openRetailTab(page, '상품');
    await expect(page.getByText('상품명·가격·옵션을 관리합니다')).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole('button', { name: '상품 등록' }).first().click();
    await expect(page.getByRole('heading', { name: '상품 등록' })).toBeVisible();

    await fieldInput(page, '상품명').fill(PRODUCT_NAME);
    await fieldInput(page, '판매가격').fill(String(PRODUCT_PRICE));
    await page.locator('form').getByRole('button', { name: '저장' }).click();

    await expect(page.getByRole('heading', { name: '상품 등록' })).toBeHidden({
      timeout: 20_000,
    });
    await expect(visibleText(page, PRODUCT_NAME)).toBeVisible({ timeout: 20_000 });
    expect(api.store.tables.products.length, 'products insert').toBeGreaterThan(0);
    const product = api.store.tables.products.find((p) => p.name === PRODUCT_NAME);
    expect(product, '등록 상품 스토어 반영').toBeTruthy();
    productId = String(product!.id);
    expect(api.store.tables.inventory.length, '상품 등록 시 inventory 자동 생성 금지').toBe(0);
  });

  test('4. 재고 입고', async () => {
    await openRetailTab(page, '재고');
    await expect(page.getByRole('heading', { name: '재고' })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: '입고' }).first().click();
    await expect(page.getByRole('heading', { name: '상품 입고' })).toBeVisible();

    await fieldInput(page, '상품').selectOption({ label: PRODUCT_NAME });
    await fieldInput(page, '입고 수량').fill(String(INBOUND_QTY));
    await page.getByRole('button', { name: '입고 완료' }).click();

    await expect(page.getByText(/입고가 완료되었습니다/)).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => api.getInventoryQty(productId)).toBe(INBOUND_QTY);
    expect(
      api.store.tables.stock_movements.some((m) => m.movement_type === 'inbound'),
      'inbound movement'
    ).toBeTruthy();
  });

  test('5~6. 고객 등록 · 상품 판매', async () => {
    await openRetailTab(page, '판매');
    await expect(page.getByRole('heading', { name: '판매' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(PRODUCT_NAME).first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: new RegExp(PRODUCT_NAME) }).first().click();
    await page.getByRole('button', { name: '결제하기' }).click();
    await expect(page.getByRole('heading', { name: '판매 완료' })).toBeVisible();

    await page.getByRole('button', { name: '신규 등록' }).click();
    await fieldInput(page, '고객명').fill(CUSTOMER_NAME);
    await page.getByRole('button', { name: '등록 후 선택' }).click();
    await expect(page.getByText(CUSTOMER_NAME).first()).toBeVisible({ timeout: 15_000 });

    const customer = api.store.tables.customers.find((c) => c.name === CUSTOMER_NAME);
    expect(customer, 'ensure_guest_customer').toBeTruthy();
    customerId = String(customer!.id);

    await page.getByRole('button', { name: '판매 완료', exact: true }).click();
    await expect(page.getByText(/판매가 완료되었습니다/)).toBeVisible({ timeout: 30_000 });

    expect(api.store.tables.sales.length, 'sales insert').toBe(1);
    expect(api.store.tables.sale_items.length, 'sale_items insert').toBe(1);
    expect(Number(api.store.tables.sale_items[0].quantity)).toBe(SALE_QTY);
  });

  test('7~8. 재고 차감 · 포인트 적립', async () => {
    await expect.poll(() => api.getInventoryQty(productId)).toBe(INBOUND_QTY - SALE_QTY);
    expect(
      api.store.tables.stock_movements.some((m) => m.movement_type === 'sale'),
      'sale movement'
    ).toBeTruthy();

    await expect.poll(() => api.getPointBalance(customerId)).toBe(EXPECTED_EARN_POINTS);
    expect(
      api.store.tables.point_transactions.some(
        (t) => t.type === 'earn' && Number(t.amount) === EXPECTED_EARN_POINTS
      ),
      'earn transaction'
    ).toBeTruthy();
  });

  test('9. 판매내역 확인', async () => {
    await openRetailTab(page, '판매내역');
    await expect(page.getByRole('heading', { name: '판매 내역' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(visibleText(page, CUSTOMER_NAME)).toBeVisible({ timeout: 20_000 });
  });

  test('10. 고객 상세에서 포인트 확인', async () => {
    await openRetailTab(page, '고객');
    await expect(page.getByRole('heading', { name: '고객' })).toBeVisible({ timeout: 20_000 });
    await visibleText(page, CUSTOMER_NAME).click();
    await expect(page.getByRole('heading', { name: '고객 상세' })).toBeVisible({ timeout: 15_000 });
    await expect(visibleText(page, String(EXPECTED_EARN_POINTS))).toBeVisible({
      timeout: 15_000,
    });
  });

  test('11~12. 반품 · 재고 복구', async () => {
    await openRetailTab(page, '판매내역');
    await visibleText(page, CUSTOMER_NAME).click();
    await expect(page.getByRole('button', { name: '반품' }).filter({ visible: true }).first()).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: '반품' }).filter({ visible: true }).first().click();
    await expect(page.getByRole('heading', { name: '반품 처리' })).toBeVisible();

    // 반품 수량은 기본 비어 있음 — 전량(1) 입력
    await page.getByLabel(new RegExp(`${PRODUCT_NAME}.*반품 수량`)).fill(String(SALE_QTY));
    await page.getByRole('button', { name: '환불 처리 확정' }).click();
    await expect(visibleText(page, /반품이 완료되었습니다/)).toBeVisible({ timeout: 30_000 });

    expect(api.store.tables.sale_returns.length, 'sale_returns').toBe(1);
    expect(api.store.tables.sale_return_items.length, 'sale_return_items').toBe(1);
    await expect.poll(() => api.getInventoryQty(productId)).toBe(INBOUND_QTY);
    expect(
      api.store.tables.stock_movements.some((m) => m.movement_type === 'return'),
      'return movement'
    ).toBeTruthy();
  });

  test('13. 일반 사용자에서 포인트 조회', async () => {
    api.linkCustomerToEndUser(customerId);

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    api.store.currentUserId = null;

    await loginAsRetailCustomerUser(page);
    await expect(visibleText(page, RETAIL_E2E.orgName)).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: '포인트' }).filter({ visible: true }).first().click();
    await expect(visibleText(page, '현재 포인트')).toBeVisible({ timeout: 20_000 });
    await expect(visibleText(page, String(EXPECTED_EARN_POINTS))).toBeVisible({
      timeout: 15_000,
    });
  });
});
