/** Core 매장 맞춤 상품 카탈로그 */

export interface ProductTypeOption {
  id: string;
  label: string;
}

export interface ProductModuleCapabilities {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSell: boolean;
  trackInventory: boolean;
  showReport: boolean;
}

export interface ProductModuleLabels {
  /** 메뉴/페이지 제목 — 예: 상품 관리, 홈케어 제품 */
  catalog: string;
  singular: string;
  sales: string;
  report: string;
}

export interface ProductModuleSettings {
  enabled: boolean;
  labels: ProductModuleLabels;
  /** 매장별 상품 유형 (자유롭게 추가/수정/삭제) */
  productTypes: ProductTypeOption[];
  capabilities: ProductModuleCapabilities;
}

export interface Product {
  id: string;
  name: string;
  /** productTypes.id 참조 — 매장 커스텀 유형 */
  productType: string;
  sku?: string;
  salePrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  isForSale: boolean;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductSaleStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';

export interface ProductSale {
  id: string;
  productId: string;
  productName: string;
  customerId?: string;
  customerName: string;
  saleDate: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  status: ProductSaleStatus;
  paymentMethod?: 'cash' | 'card' | 'transfer' | null;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductStats {
  yearMonth: string;
  monthlySaleAmount: number;
  monthlyPaidAmount: number;
  monthlyUnitsSold: number;
  totalUnpaidAmount: number;
  lowStockCount: number;
  productCount: number;
  topProducts: { productId: string; name: string; quantity: number; amount: number }[];
}
