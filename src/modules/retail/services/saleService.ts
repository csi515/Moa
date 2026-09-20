import { getCoreClient, isSupabaseConfigured } from '@/lib/supabase';
import { inventorySaleStock } from './inventorySaleStock';
import { pointEarnService } from '@/core/loyalty/pointEarnService';
import { pointRedeemService } from '@/core/loyalty/pointRedeemService';
import {
  buildProductNameSnapshot,
  type Sale,
  type SaleCatalogItem,
  type SaleCreateInput,
  type SaleItem,
  type SalePaymentMethod,
  type SaleStatus,
  type SaleWithItems,
} from '../types/sale';
import type { SaleStockDeductLine, StockShortfall } from '../types/inventory';

type SaleRow = {
  id: string;
  organization_id: string;
  customer_id: string | null;
  total_amount: number | string;
  points_used?: number | string | null;
  payment_method: SalePaymentMethod;
  status: SaleStatus;
  created_at: string;
};

type SaleItemRow = {
  id: string;
  sale_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  quantity: number | string;
  unit_price: number | string;
  discount_amount: number | string;
  line_amount: number | string;
};

type ProductRow = {
  id: string;
  name: string;
  product_code: string | null;
  price: number | string;
  is_active: boolean;
};

type VariantRow = {
  id: string;
  product_id: string;
  name: string;
  price: number | string | null;
  is_active: boolean;
};

function toNumber(value: number | string | null | undefined): number {
  if (value == null || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function ensureClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase가 설정되지 않았습니다.');
  }
  return getCoreClient();
}

function mapSale(row: SaleRow): Sale {
  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    totalAmount: toNumber(row.total_amount),
    pointsUsed: toNumber(row.points_used),
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapSaleItem(row: SaleItemRow): SaleItem {
  return {
    id: row.id,
    saleId: row.sale_id,
    productId: row.product_id,
    variantId: row.variant_id,
    productNameSnapshot: row.product_name_snapshot,
    quantity: toNumber(row.quantity),
    unitPrice: toNumber(row.unit_price),
    discountAmount: toNumber(row.discount_amount),
    lineAmount: toNumber(row.line_amount),
  };
}

/**
 * 판매 등록.
 * 저장 후 재고 차감(StockMovement sale + Inventory). 포인트·PG·Finance 없음.
 */
export const saleService = {
  /** 판매중 상품·옵션 카탈로그 (검색/선택용) */
  async listCatalog(organizationId: string): Promise<SaleCatalogItem[]> {
    const client = ensureClient();
    const [productsRes, variantsRes] = await Promise.all([
      client
        .from('products')
        .select('id, name, product_code, price, is_active')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name', { ascending: true }),
      client
        .from('product_variants')
        .select('id, product_id, name, price, is_active'),
    ]);
    if (productsRes.error) throw productsRes.error;
    if (variantsRes.error) throw variantsRes.error;

    const products = (productsRes.data as ProductRow[] | null) ?? [];
    const productIds = new Set(products.map((p) => p.id));

    const variantsByProduct = new Map<string, VariantRow[]>();
    for (const v of (variantsRes.data as VariantRow[] | null) ?? []) {
      if (!productIds.has(v.product_id) || !v.is_active) continue;
      const list = variantsByProduct.get(v.product_id) ?? [];
      list.push(v);
      variantsByProduct.set(v.product_id, list);
    }

    const rows: SaleCatalogItem[] = [];
    for (const product of products) {
      const variants = variantsByProduct.get(product.id) ?? [];
      if (variants.length > 0) {
        const sorted = [...variants].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        for (const variant of sorted) {
          const unitPrice =
            variant.price == null || variant.price === ''
              ? toNumber(product.price)
              : toNumber(variant.price);
          rows.push({
            key: `v:${variant.id}`,
            productId: product.id,
            productName: product.name,
            productCode: product.product_code,
            variantId: variant.id,
            variantName: variant.name,
            unitPrice,
          });
        }
      } else {
        rows.push({
          key: `p:${product.id}`,
          productId: product.id,
          productName: product.name,
          productCode: product.product_code,
          variantId: null,
          variantName: null,
          unitPrice: toNumber(product.price),
        });
      }
    }
    return rows;
  },

  /**
   * 판매 전 재고 부족 확인.
   * Retail 전 상품/옵션이 재고 관리 대상.
   */
  async checkStockShortfalls(
    organizationId: string,
    items: SaleCreateInput['items']
  ): Promise<StockShortfall[]> {
    const lines: SaleStockDeductLine[] = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      label: item.productNameSnapshot,
    }));
    return inventorySaleStock.checkShortfalls(organizationId, lines);
  },

  /**
   * 판매 완료 저장 + 재고 차감 + 포인트 사용(선택) + 포인트 적립(조건부).
   * 적립 공식(floor)은 변경하지 않음. 적립 기준금액 = 총액 - 사용포인트.
   */
  async createSale(input: SaleCreateInput): Promise<SaleWithItems> {
    const client = ensureClient();
    if (!input.items.length) {
      throw new Error('판매할 상품을 담아 주세요.');
    }

    const lineRows = input.items.map((item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const discountAmount = Math.max(0, Number(item.discountAmount ?? 0));
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        throw new Error('수량은 1 이상의 정수여야 합니다.');
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error('단가가 올바르지 않습니다.');
      }
      const snapshot =
        item.productNameSnapshot.trim() ||
        buildProductNameSnapshot('상품', null);
      const lineAmount = Math.max(0, quantity * unitPrice - discountAmount);
      return {
        product_id: item.productId,
        variant_id: item.variantId || null,
        product_name_snapshot: snapshot,
        quantity,
        unit_price: unitPrice,
        discount_amount: discountAmount,
        line_amount: lineAmount,
      };
    });

    const totalAmount = lineRows.reduce((sum, row) => sum + row.line_amount, 0);
    const pointsUsed = Math.max(0, Math.floor(Number(input.pointsUsed) || 0));
    if (pointsUsed > totalAmount) {
      throw new Error('사용 포인트는 결제금액을 초과할 수 없습니다.');
    }
    if (pointsUsed > 0 && !input.customerId) {
      throw new Error('포인트를 사용하려면 고객을 선택해 주세요.');
    }

    const { data: saleRow, error: saleError } = await client
      .from('sales')
      .insert({
        organization_id: input.organizationId,
        customer_id: input.customerId || null,
        total_amount: totalAmount,
        points_used: pointsUsed,
        payment_method: input.paymentMethod,
        status: 'completed',
      })
      .select('*')
      .single();
    if (saleError) throw saleError;

    const saleId = (saleRow as SaleRow).id;
    const { data: itemRows, error: itemsError } = await client
      .from('sale_items')
      .insert(lineRows.map((row) => ({ ...row, sale_id: saleId })))
      .select('*');
    if (itemsError) throw itemsError;

    const deductLines: SaleStockDeductLine[] = input.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      label: item.productNameSnapshot,
    }));
    await inventorySaleStock.applyDeductions(
      input.organizationId,
      saleId,
      deductLines
    );

    if (pointsUsed > 0) {
      await pointRedeemService.redeemForSale({
        organizationId: input.organizationId,
        customerId: input.customerId,
        saleId,
        pointsToUse: pointsUsed,
        saleTotalAmount: totalAmount,
      });
    }

    // 적립 기준 = 실제 결제액(총액 - 사용 포인트). 공식(floor)은 동일.
    const eligibleEarnAmount = Math.max(0, totalAmount - pointsUsed);
    try {
      await pointEarnService.earnForSale({
        organizationId: input.organizationId,
        customerId: input.customerId,
        saleId,
        eligibleAmount: eligibleEarnAmount,
      });
    } catch (earnError) {
      console.error('[saleService.createSale] point earn failed', earnError);
    }

    return {
      ...mapSale(saleRow as SaleRow),
      items: ((itemRows as SaleItemRow[] | null) ?? []).map(mapSaleItem),
    };
  },
};
