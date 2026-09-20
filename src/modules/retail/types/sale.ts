/**
 * Retail 판매 타입 — Core 공통 + POS/목록 UI 전용.
 */
export type {
  Sale,
  SaleCatalogItem,
  SaleCreateInput,
  SaleItem,
  SalePaymentMethod,
  SaleStatus,
  SaleWithItems,
} from '@/core/sales';
export {
  SALE_PAYMENT_METHODS,
  SALE_PAYMENT_METHOD_LABELS,
  SALE_STATUSES,
  SALE_STATUS_LABELS,
  buildProductNameSnapshot,
} from '@/core/sales';
import type { Sale, SalePaymentMethod } from '@/core/sales';

/** POS에서 노출하는 결제수단 */
export const POS_PAYMENT_METHODS: readonly SalePaymentMethod[] = [
  'card',
  'cash',
  'transfer',
  'other',
] as const;

/** 장바구니 라인 */
export interface SaleCartLine {
  key: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  unitPrice: number;
  quantity: number;
}

/** 고객 선택용 간단 행 */
export type SaleCustomerOption = {
  id: string;
  name: string;
  phone: string | null;
};

export function cartLineAmount(line: Pick<SaleCartLine, 'unitPrice' | 'quantity'>): number {
  return Math.max(0, line.unitPrice) * Math.max(0, line.quantity);
}

export function cartTotalAmount(lines: SaleCartLine[]): number {
  return lines.reduce((sum, line) => sum + cartLineAmount(line), 0);
}

/** 판매번호 표시 (UUID 앞 8자) */
export function formatSaleNumber(saleId: string): string {
  return saleId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

/** 목록 행 — 고객명·상품 요약 포함 */
export interface SaleListItem extends Sale {
  customerName: string | null;
  productSummaries: string[];
  itemCount: number;
}

export type SalePaymentFilter = 'ALL' | SalePaymentMethod;
export type SaleCustomerFilter = 'ALL' | 'MEMBER' | 'GUEST';

export interface SaleListQuery {
  organizationId: string;
  /** YYYY-MM-DD (로컬 날짜) */
  date: string;
  paymentMethod?: SalePaymentFilter;
  customerFilter?: SaleCustomerFilter;
  search?: string;
}
