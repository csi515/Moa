/**
 * Retail 판매 도메인 타입 (DB: core.sales / core.sale_items).
 * 상품명·단가는 판매 시점 snapshot. 재고 차감·포인트·PG·Finance와 무관.
 */

/** 판매 상태 — core.sale_status 와 동기화 */
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

/**
 * 결제 수단 — core.payment_method 재사용.
 * PG 연동 없음.
 */
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

/** 판매 헤더 */
export interface Sale {
  id: string;
  organizationId: string;
  /** null = 고객 없는 판매 */
  customerId: string | null;
  /** 상품 라인 합계 */
  totalAmount: number;
  /** 사용한 포인트(원 환산, 1P=1원). 최종 결제 = totalAmount - pointsUsed */
  pointsUsed: number;
  paymentMethod: SalePaymentMethod;
  status: SaleStatus;
  createdAt: string;
}

/**
 * 판매 라인.
 * productNameSnapshot / unitPrice 는 판매 시점 값 — 이후 마스터 변경에 영향받지 않음.
 */
export interface SaleItem {
  id: string;
  saleId: string;
  /** 상품 삭제 시 null 가능. 표시는 productNameSnapshot */
  productId: string | null;
  variantId: string | null;
  productNameSnapshot: string;
  quantity: number;
  /** 판매 시점 단가 snapshot */
  unitPrice: number;
  discountAmount: number;
  lineAmount: number;
}

/** 판매 + 라인 (조회용) */
export interface SaleWithItems extends Sale {
  items: SaleItem[];
}

/** POS에서 노출하는 결제수단 (카드·현금·계좌이체·기타) */
export const POS_PAYMENT_METHODS: readonly SalePaymentMethod[] = [
  'card',
  'cash',
  'transfer',
  'other',
] as const;

/** 판매 화면용 상품 카탈로그 행 (SKU 단위) */
export interface SaleCatalogItem {
  key: string;
  productId: string;
  productName: string;
  productCode: string | null;
  variantId: string | null;
  variantName: string | null;
  /** 판매 시점 스냅샷에 쓸 단가 */
  unitPrice: number;
}

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

/** 판매 완료 입력 */
export interface SaleCreateInput {
  organizationId: string;
  customerId?: string | null;
  paymentMethod: SalePaymentMethod;
  /** 사용할 포인트(양수, 1P=1원). 고객·포인트 사용 ON 필요 */
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

/** 고객 선택용 간단 행 — Core CustomerSearchResult 와 동일 형태 */
export type SaleCustomerOption = {
  id: string;
  name: string;
  phone: string | null;
};

export function buildProductNameSnapshot(
  productName: string,
  variantName: string | null | undefined
): string {
  const base = productName.trim();
  const option = variantName?.trim();
  return option ? `${base} / ${option}` : base;
}

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
  /** 스냅샷 상품명 목록 (표시용) */
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
  /** 판매번호·고객·상품 검색 */
  search?: string;
}
