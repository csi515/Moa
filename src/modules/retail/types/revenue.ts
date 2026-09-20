import type { SalePaymentMethod } from './sale';

/** 매출 조회 기간 프리셋 */
export type RevenuePeriodPreset = 'today' | 'week' | 'month' | 'custom';

export interface RevenueDateRange {
  /** YYYY-MM-DD inclusive */
  fromYmd: string;
  /** YYYY-MM-DD inclusive */
  toYmd: string;
}

export interface RevenuePaymentBreakdown {
  paymentMethod: SalePaymentMethod;
  amount: number;
  count: number;
}

export interface RevenueProductBreakdown {
  key: string;
  productId: string | null;
  productNameSnapshot: string;
  quantity: number;
  amount: number;
}

/** Sale 기준 매출 요약 — 포인트 잔액 미포함, 반품은 별도 */
export interface RetailRevenueSummary {
  range: RevenueDateRange;
  /** Σ sales.total_amount (상품 합계). points_used 차감 안 함 */
  totalSalesAmount: number;
  saleCount: number;
  /** Σ sale_returns.total_amount (별도 표시용) */
  totalReturnAmount: number;
  returnCount: number;
  byPayment: RevenuePaymentBreakdown[];
  byProduct: RevenueProductBreakdown[];
}
