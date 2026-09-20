/**
 * Core 판매·반품 도메인 타입 (DB: core.sales / sale_items / sale_returns / sale_return_items).
 * 포인트 적립·사용·Finance는 Module/loyalty 계층에서 처리.
 */

export type SaleStatus = 'completed' | 'cancelled' | 'refunded';

export const SALE_STATUSES: readonly SaleStatus[] = [
  'completed',
  'cancelled',
  'refunded',
] as const;

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  completed: '완료',
  cancelled: '취소',
  refunded: '환불',
};

export type SalePaymentMethod =
  | 'cash'
  | 'card'
  | 'transfer'
  | 'online'
  | 'other'
  | 'local_currency'
  | 'onsite_card';

export const SALE_PAYMENT_METHODS: readonly SalePaymentMethod[] = [
  'cash',
  'card',
  'transfer',
  'online',
  'other',
  'local_currency',
  'onsite_card',
] as const;

export const SALE_PAYMENT_METHOD_LABELS: Record<SalePaymentMethod, string> = {
  cash: '현금',
  card: '카드',
  transfer: '계좌이체',
  online: '온라인',
  other: '기타',
  local_currency: '지역화폐',
  onsite_card: '현장카드',
};

export interface Sale {
  id: string;
  organizationId: string;
  customerId: string | null;
  totalAmount: number;
  pointsUsed: number;
  paymentMethod: SalePaymentMethod;
  status: SaleStatus;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string | null;
  variantId: string | null;
  productNameSnapshot: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineAmount: number;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
}

export interface SaleCatalogItem {
  key: string;
  productId: string;
  productName: string;
  productCode: string | null;
  variantId: string | null;
  variantName: string | null;
  unitPrice: number;
}

export interface SaleCreateInput {
  organizationId: string;
  customerId?: string | null;
  paymentMethod: SalePaymentMethod;
  /** DB 컬럼만 기록. 포인트 ledger는 loyalty Module에서 별도 호출 */
  pointsUsed?: number;
  items: Array<{
    productId: string;
    variantId?: string | null;
    productNameSnapshot: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
  }>;
}

export function buildProductNameSnapshot(
  productName: string,
  variantName: string | null | undefined
): string {
  const base = productName.trim();
  const option = variantName?.trim();
  return option ? `${base} / ${option}` : base;
}

export interface SaleReturn {
  id: string;
  organizationId: string;
  saleId: string;
  totalAmount: number;
  reason: string | null;
  createdAt: string;
}

export interface SaleReturnItem {
  id: string;
  saleReturnId: string;
  saleItemId: string;
  productId: string | null;
  variantId: string | null;
  productNameSnapshot: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
}

export interface SaleReturnWithItems extends SaleReturn {
  items: SaleReturnItem[];
}

export interface SaleReturnCreateInput {
  organizationId: string;
  saleId: string;
  reason?: string | null;
  items: Array<{
    saleItemId: string;
    quantity: number;
  }>;
}

export interface SaleItemReturnable {
  saleItemId: string;
  productNameSnapshot: string;
  productId: string | null;
  variantId: string | null;
  soldQuantity: number;
  returnedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  discountAmount: number;
  lineAmount: number;
}

export function computeReturnLineAmount(params: {
  returnQty: number;
  soldQty: number;
  unitPrice: number;
  discountAmount: number;
}): number {
  const returnQty = Math.max(0, params.returnQty);
  const soldQty = Math.max(0, params.soldQty);
  if (returnQty <= 0 || soldQty <= 0) return 0;
  const proportionalDiscount =
    (Math.max(0, params.discountAmount) * returnQty) / soldQty;
  return Math.max(0, returnQty * Math.max(0, params.unitPrice) - proportionalDiscount);
}
