/**
 * Retail 매출 Gross/Returns/Net 집계 unit test
 * 실행: npm run test:retail-revenue
 */
import assert from 'node:assert/strict';
import {
  buildRetailRevenueSummary,
  computeNetSalesAmount,
  filterCompletedSales,
  isCompletedSaleStatus,
  normalizeInclusiveRange,
} from './retailRevenueAggregate';
import type { RevenueSaleInput } from './retailRevenueAggregate';

function sale(
  id: string,
  amount: number,
  opts?: { status?: string; method?: RevenueSaleInput['paymentMethod'] }
): RevenueSaleInput {
  return {
    id,
    totalAmount: amount,
    paymentMethod: opts?.method ?? 'cash',
    status: opts?.status ?? 'completed',
  };
}

const range = { fromYmd: '2026-09-01', toYmd: '2026-09-30' };

// ── 1. 판매 100,000 / 반품 0 ──────────────────────────────────────
{
  const summary = buildRetailRevenueSummary({
    range,
    sales: [sale('s1', 100000)],
    returns: [],
    saleItems: [
      {
        saleId: 's1',
        productId: 'p1',
        productNameSnapshot: '상품A',
        quantity: 10,
        lineAmount: 100000,
      },
    ],
  });
  assert.equal(summary.totalSalesAmount, 100000);
  assert.equal(summary.totalReturnAmount, 0);
  assert.equal(summary.netSalesAmount, 100000);
  assert.equal(summary.saleCount, 1);
  assert.equal(summary.byProduct[0]?.quantity, 10);
}

// ── 2. 판매 100,000 / 반품 30,000 → 순매출 70,000 ─────────────────
{
  const summary = buildRetailRevenueSummary({
    range,
    sales: [sale('s1', 100000)],
    returns: [{ id: 'r1', totalAmount: 30000 }],
    saleItems: [],
  });
  assert.equal(summary.netSalesAmount, 70000);
  assert.equal(computeNetSalesAmount(100000, 30000), 70000);
}

// ── 3. 일부 반품 여러 번 누적 ─────────────────────────────────────
{
  const summary = buildRetailRevenueSummary({
    range,
    sales: [sale('s1', 100000)],
    returns: [
      { id: 'r1', totalAmount: 10000 },
      { id: 'r2', totalAmount: 15000 },
      { id: 'r3', totalAmount: 5000 },
    ],
    saleItems: [],
  });
  assert.equal(summary.totalReturnAmount, 30000);
  assert.equal(summary.returnCount, 3);
  assert.equal(summary.netSalesAmount, 70000);
}

// ── 4. 완전 반품 → 순매출 0 ───────────────────────────────────────
{
  const summary = buildRetailRevenueSummary({
    range,
    sales: [sale('s1', 50000)],
    returns: [{ id: 'r1', totalAmount: 50000 }],
    saleItems: [],
  });
  assert.equal(summary.netSalesAmount, 0);
}

// ── 5. cancelled / refunded 는 Gross에서 제외 ─────────────────────
{
  assert.equal(isCompletedSaleStatus('completed'), true);
  assert.equal(isCompletedSaleStatus('cancelled'), false);
  assert.equal(isCompletedSaleStatus('refunded'), false);

  const sales = [
    sale('ok', 100000, { status: 'completed' }),
    sale('c', 40000, { status: 'cancelled' }),
    sale('r', 20000, { status: 'refunded' }),
  ];
  assert.equal(filterCompletedSales(sales).length, 1);

  const summary = buildRetailRevenueSummary({
    range,
    sales,
    returns: [{ id: 'ret', totalAmount: 10000 }],
    saleItems: [
      {
        saleId: 'ok',
        productId: 'p1',
        productNameSnapshot: 'A',
        quantity: 1,
        lineAmount: 100000,
      },
      {
        saleId: 'c',
        productId: 'p2',
        productNameSnapshot: 'B',
        quantity: 9,
        lineAmount: 40000,
      },
    ],
  });
  assert.equal(summary.totalSalesAmount, 100000);
  assert.equal(summary.saleCount, 1);
  assert.equal(summary.netSalesAmount, 90000);
  assert.equal(summary.byProduct.length, 1);
  assert.equal(summary.byProduct[0]?.productNameSnapshot, 'A');
}

// ── 6. 기간 normalize (from>to 교환) ──────────────────────────────
{
  const normalized = normalizeInclusiveRange({
    fromYmd: '2026-09-10',
    toYmd: '2026-09-01',
  });
  assert.equal(normalized.fromYmd, '2026-09-01');
  assert.equal(normalized.toYmd, '2026-09-10');
}

// ── 7. 상품별은 총 판매( Gross ) — 반품 미차감 계약 ───────────────
{
  const summary = buildRetailRevenueSummary({
    range,
    sales: [sale('s1', 100000)],
    returns: [{ id: 'r1', totalAmount: 30000 }],
    saleItems: [
      {
        saleId: 's1',
        productId: 'p1',
        productNameSnapshot: '양말',
        quantity: 10,
        lineAmount: 100000,
      },
    ],
  });
  assert.equal(summary.byProduct[0]?.quantity, 10);
  assert.equal(summary.byProduct[0]?.amount, 100000);
  assert.equal(summary.netSalesAmount, 70000);
}

// ── 결제수단은 Gross만 (반품 배분 없음) ───────────────────────────
{
  const summary = buildRetailRevenueSummary({
    range,
    sales: [
      sale('s1', 60000, { method: 'card' }),
      sale('s2', 40000, { method: 'cash' }),
    ],
    returns: [{ id: 'r1', totalAmount: 20000 }],
    saleItems: [],
  });
  assert.equal(summary.byPayment.find((p) => p.paymentMethod === 'card')?.amount, 60000);
  assert.equal(summary.byPayment.find((p) => p.paymentMethod === 'cash')?.amount, 40000);
  assert.equal(summary.netSalesAmount, 80000);
}

console.log('retailRevenueAggregate.test.ts: ok');
