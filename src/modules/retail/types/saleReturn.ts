/**
 * 판매 반품 도메인 타입 (DB: core.sale_returns / sale_return_items).
 * 원본 Sale은 불변. 포인트·PG와 무관.
 */

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

/** 반품 생성 입력 */
export interface SaleReturnCreateInput {
  organizationId: string;
  saleId: string;
  reason?: string | null;
  items: Array<{
    saleItemId: string;
    quantity: number;
  }>;
}

/** 상세용 — 라인별 반품 가능 잔량 */
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
