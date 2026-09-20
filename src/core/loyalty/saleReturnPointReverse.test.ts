/**
 * 판매 반품 포인트 비례·Finance 반전 단위 테스트
 * 실행: npx tsx src/core/loyalty/saleReturnPointReverse.test.ts
 */
import assert from 'node:assert/strict';
import {
  allocateReturnPointSlice,
  planSaleReturnPointAdjustments,
} from './saleReturnPointPlan';

type IncomeStub = {
  id: string;
  sourceType: 'retail';
  sourceId: string;
  amount: number;
  memo?: string;
};

/** recordRetailSaleReturnIncomeReversal 계약 재현 (storage/supabase 의존 없음) */
function applyRetailReturnIncomeReversal(
  entries: IncomeStub[],
  params: { saleId: string; returnId: string; amount: number }
): IncomeStub[] {
  const amount = Math.abs(params.amount);
  if (!params.returnId || !params.saleId || amount <= 0) return entries;
  if (entries.some((e) => e.sourceType === 'retail' && e.sourceId === params.returnId)) {
    return entries;
  }
  return [
    {
      id: `inc-${params.returnId}`,
      sourceType: 'retail',
      sourceId: params.returnId,
      amount: -amount,
      memo: `saleId=${params.saleId};returnId=${params.returnId}`,
    },
    ...entries,
  ];
}

// ── 전량 반품: 적립만 ────────────────────────────────────────────
{
  const plan = planSaleReturnPointAdjustments({
    saleTotalAmount: 10000,
    pointsEarned: 100,
    pointsRedeemed: 0,
    thisReturnAmount: 10000,
    priorReturnedAmount: 0,
    priorEarnClawed: 0,
    priorRedeemRestored: 0,
  });
  assert.equal(plan.earnClawback, 100);
  assert.equal(plan.redeemRestore, 0);
}

// ── 전량 반품: 사용만 ────────────────────────────────────────────
{
  const plan = planSaleReturnPointAdjustments({
    saleTotalAmount: 10000,
    pointsEarned: 0,
    pointsRedeemed: 2000,
    thisReturnAmount: 10000,
    priorReturnedAmount: 0,
    priorEarnClawed: 0,
    priorRedeemRestored: 0,
  });
  assert.equal(plan.earnClawback, 0);
  assert.equal(plan.redeemRestore, 2000);
}

// ── 전량 반품: 적립+사용 ─────────────────────────────────────────
{
  const plan = planSaleReturnPointAdjustments({
    saleTotalAmount: 10000,
    pointsEarned: 80,
    pointsRedeemed: 1000,
    thisReturnAmount: 10000,
    priorReturnedAmount: 0,
    priorEarnClawed: 0,
    priorRedeemRestored: 0,
  });
  assert.equal(plan.earnClawback, 80);
  assert.equal(plan.redeemRestore, 1000);
}

// ── 포인트 미사용·미적립 ─────────────────────────────────────────
{
  const plan = planSaleReturnPointAdjustments({
    saleTotalAmount: 5000,
    pointsEarned: 0,
    pointsRedeemed: 0,
    thisReturnAmount: 5000,
    priorReturnedAmount: 0,
    priorEarnClawed: 0,
    priorRedeemRestored: 0,
  });
  assert.equal(plan.earnClawback, 0);
  assert.equal(plan.redeemRestore, 0);
}

// ── 부분 반품 비례 + 잔여 흡수 ───────────────────────────────────
{
  const earned = 100;
  const saleTotal = 10000;
  const first = allocateReturnPointSlice({
    originalPoints: earned,
    saleTotalAmount: saleTotal,
    priorReturnedAmount: 0,
    thisReturnAmount: 3000,
    priorAllocatedPoints: 0,
  });
  assert.equal(first, 30);

  const second = allocateReturnPointSlice({
    originalPoints: earned,
    saleTotalAmount: saleTotal,
    priorReturnedAmount: 3000,
    thisReturnAmount: 7000,
    priorAllocatedPoints: first,
  });
  assert.equal(second, 70);
  assert.equal(first + second, 100);
}

// ── 반품 재실행(이미 배분됨) → 0 ─────────────────────────────────
{
  const again = allocateReturnPointSlice({
    originalPoints: 100,
    saleTotalAmount: 10000,
    priorReturnedAmount: 10000,
    thisReturnAmount: 10000,
    priorAllocatedPoints: 100,
  });
  assert.equal(again, 0);
}

// ── organization 스냅샷 분리 ─────────────────────────────────────
{
  const planA = planSaleReturnPointAdjustments({
    saleTotalAmount: 1000,
    pointsEarned: 10,
    pointsRedeemed: 0,
    thisReturnAmount: 1000,
    priorReturnedAmount: 0,
    priorEarnClawed: 0,
    priorRedeemRestored: 0,
  });
  const planB = planSaleReturnPointAdjustments({
    saleTotalAmount: 2000,
    pointsEarned: 50,
    pointsRedeemed: 100,
    thisReturnAmount: 2000,
    priorReturnedAmount: 0,
    priorEarnClawed: 0,
    priorRedeemRestored: 0,
  });
  assert.equal(planA.earnClawback, 10);
  assert.equal(planB.earnClawback, 50);
  assert.equal(planB.redeemRestore, 100);
}

// ── Skin Finance: 판매 income 유지 + 반품 reversal + idempotent ──
{
  const saleId = 'sale-skin-1';
  const returnId = 'return-skin-1';
  let entries: IncomeStub[] = [
    {
      id: 'inc-sale-1',
      sourceType: 'retail',
      sourceId: saleId,
      amount: 30000,
    },
  ];

  entries = applyRetailReturnIncomeReversal(entries, {
    saleId,
    returnId,
    amount: 30000,
  });
  assert.equal(entries.find((e) => e.sourceId === saleId)?.amount, 30000);
  assert.equal(entries.find((e) => e.sourceId === returnId)?.amount, -30000);

  const beforeLen = entries.length;
  entries = applyRetailReturnIncomeReversal(entries, {
    saleId,
    returnId,
    amount: 30000,
  });
  assert.equal(entries.length, beforeLen);
  assert.equal(
    entries.filter((e) => e.sourceId === returnId).length,
    1
  );
  assert.equal(
    entries.filter((e) => e.sourceType === 'retail').reduce((s, e) => s + e.amount, 0),
    0
  );
}

// ── Retail: 포인트 plan만 (Finance IncomeEntry 강제 없음) ────────
{
  const plan = planSaleReturnPointAdjustments({
    saleTotalAmount: 8000,
    pointsEarned: 40,
    pointsRedeemed: 500,
    thisReturnAmount: 8000,
    priorReturnedAmount: 0,
    priorEarnClawed: 0,
    priorRedeemRestored: 0,
  });
  assert.equal(plan.earnClawback, 40);
  assert.equal(plan.redeemRestore, 500);
}

console.log('saleReturnPointReverse.test.ts: ok');
console.log(
  JSON.stringify(
    {
      retailFlow: {
        sale: { earn: '+80P', redeem: '-1000P' },
        fullReturn: { earnClawback: '-80P adjust', redeemRestore: '+1000P adjust' },
      },
      skinFlow: {
        saleIncome: { sourceId: 'saleId', amount: 30000 },
        returnReversal: { sourceId: 'returnId', amount: -30000 },
        originalPreserved: true,
      },
    },
    null,
    2
  )
);
