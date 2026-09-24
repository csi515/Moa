/** Retail 매출 집계 — Commerce revenueAggregate facade */
export {
  aggregatePaymentBreakdown,
  aggregateProductBreakdown,
  buildRetailRevenueSummary,
  computeNetSalesAmount,
  filterCompletedSales,
  isCompletedSaleStatus,
  normalizeInclusiveRange,
} from '@/core/commerce/sale';
export type {
  RevenueReturnInput,
  RevenueSaleInput,
  RevenueSaleItemInput,
} from '@/core/commerce/sale';
