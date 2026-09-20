/**
 * Retail 상품 도메인 타입 (DB: core.products / core.product_variants / core.product_categories).
 * Skin settings의 RetailProduct(카탈로그+재고)와 별개 — 연결·재사용하지 않음.
 */

/** 상품 카테고리 */
export interface ProductCategory {
  id: string;
  organizationId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 상품 마스터. 옵션이 없어도 단독 저장 가능. */
export interface Product {
  id: string;
  organizationId: string;
  name: string;
  categoryId: string | null;
  productCode: string | null;
  price: number;
  cost: number | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 상품 옵션/변형.
 * price·cost가 null이면 상위 Product 값을 사용(앱 레이어 해석).
 */
export interface ProductVariant {
  id: string;
  productId: string;
  /** 옵션 라벨 (예: 색상/사이즈) */
  name: string;
  sku: string | null;
  price: number | null;
  cost: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 목록 행 — 옵션 개수·카테고리명 포함 */
export interface ProductListItem extends Product {
  variantCount: number;
  categoryName: string | null;
}

export type ProductStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

/** 옵션 행 저장 입력 — id가 있으면 기존 행 유지·갱신 */
export interface ProductVariantSaveInput {
  id?: string;
  name: string;
  sku?: string | null;
  price?: number | null;
  cost?: number | null;
  isActive?: boolean;
}

export interface ProductSaveInput {
  name: string;
  categoryId?: string | null;
  /** 새 카테고리명 — categoryId가 없을 때 생성 */
  newCategoryName?: string | null;
  productCode?: string | null;
  price: number;
  cost?: number | null;
  isActive?: boolean;
  /**
   * 옵션 동기화.
   * - undefined: 옵션 테이블 변경 없음
   * - []: 옵션 전부 제거 (옵션 없음)
   * - 항목: id 있으면 갱신, 없으면 추가. 목록에 없는 기존 id는 삭제
   */
  variants?: ProductVariantSaveInput[];
}
