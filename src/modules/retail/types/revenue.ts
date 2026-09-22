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
  /** 기간 내 completed 판매 total_amount 합 (반품 미차감) */
  amount: number;
  count: number;
}

export interface RevenueProductBreakdown {
  key: string;
  productId: string | null;
  productNameSnapshot: string;
  /** 기간 내 completed 판매 라인 수량 합 (총 판매 수량, 반품 미차감) */
  quantity: number;
  /** 기간 내 completed 판매 라인 금액 합 (총 판매 금액, 반품 미차감) */
  amount: number;
}

/**
 * Sale/SaleReturn 기준 매출 요약.
 * - Gross: completed 판매만
 * - Returns: 기간 내 sale_returns (별도 표시)
 * - Net: Gross − Returns
 * 포인트 잔액·Finance와 무관. 반품은 결제수단 배분 없음.
 */
export interface RetailRevenueSummary {
  range: RevenueDateRange;
  /** 총 판매액 = Σ completed sales.total_amount (points_used 차감 안 함) */
  totalSalesAmount: number;
  /** completed 판매 건수 */
  saleCount: number;
  /** 반품액 = Σ sale_returns.total_amount */
  totalReturnAmount: number;
  returnCount: number;
  /** 순매출 = totalSalesAmount − totalReturnAmount */
  netSalesAmount: number;
  /** 결제수단별 총 판매액 (completed만, 반품 미반영) */
  byPayment: RevenuePaymentBreakdown[];
  /** 상품별 총 판매 수량·금액 (completed만, 반품 미차감) */
  byProduct: RevenueProductBreakdown[];
}
