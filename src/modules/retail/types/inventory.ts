/**
 * Retail 재고 도메인 타입 (DB: core.inventory / core.stock_movements).
 * 잔량은 Inventory, 증감 이력은 StockMovement. Finance와 무관.
 */

/** 재고 이동 유형 — core.stock_movement_type 와 동기화 */
export type StockMovementType = 'inbound' | 'sale' | 'return' | 'adjustment';

export const STOCK_MOVEMENT_TYPES: readonly StockMovementType[] = [
  'inbound',
  'sale',
  'return',
  'adjustment',
] as const;

/** inbound = 입고/매입(purchase) */
export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  inbound: '입고',
  sale: '판매',
  return: '반품',
  adjustment: '조정',
};

/** 현재 재고 잔량 */
export interface Inventory {
  id: string;
  organizationId: string;
  productId: string | null;
  variantId: string | null;
  quantity: number;
  updatedAt: string;
}

/** 재고 이동 이력 (quantity는 부호 있는 증감) */
export interface StockMovement {
  id: string;
  organizationId: string;
  productId: string | null;
  variantId: string | null;
  movementType: StockMovementType;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  reason: string | null;
  createdAt: string;
}

/** 재고 조회 목록 행 (상품/옵션 × 현재 수량) */
export interface InventoryStockRow {
  key: string;
  productId: string;
  productName: string;
  productCode: string | null;
  variantId: string | null;
  /** null이면 단일 상품(옵션 없음) */
  variantName: string | null;
  quantity: number;
  /** 판매중 여부 (옵션이 있으면 옵션 기준, 없으면 상품 기준) */
  isActive: boolean;
  /** 상품 자체가 판매중인지 */
  productIsActive: boolean;
}

export type InventoryStockFilter = 'ALL' | 'LOW' | 'OUT';

/** 재고 부족 기준 수량 (이하이면 부족, 0은 없음) */
export const INVENTORY_LOW_STOCK_THRESHOLD = 5;

/** 입고 입력 */
export interface StockInboundInput {
  organizationId: string;
  productId: string;
  variantId?: string | null;
  /** 입고 수량 (양수만) */
  quantity: number;
  reason?: string | null;
}

/** 재고 조정 사유 프리셋 */
export const STOCK_ADJUSTMENT_REASONS = [
  '실사 차이',
  '분실',
  '파손',
  '기타',
] as const;

export type StockAdjustmentReasonPreset = (typeof STOCK_ADJUSTMENT_REASONS)[number];

/** 재고 조정 입력 (quantity는 부호 있는 증감, 예: -2) */
export interface StockAdjustmentInput {
  organizationId: string;
  productId: string;
  variantId?: string | null;
  /** 조정 수량 (양수=증가, 음수=감소, 0 불가) */
  quantity: number;
  /** 조정 사유 (필수) */
  reason: string;
}

/**
 * 판매 재고 차감 라인.
 * Retail은 상품/옵션 전부 재고 관리 대상(별도 track 플래그 없음).
 */
export interface SaleStockDeductLine {
  productId: string;
  variantId?: string | null;
  /** 판매 수량(양수) */
  quantity: number;
  /** 부족 경고 표시용 라벨 */
  label: string;
}

/** 판매 전 재고 부족 항목 */
export interface StockShortfall {
  productId: string;
  variantId: string | null;
  label: string;
  required: number;
  available: number;
}
