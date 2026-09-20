import { getCoreClient, isSupabaseConfigured } from '@/lib/supabase';
import { stockSaleOps, type SaleStockDeductLine, type StockShortfall } from '@/core/inventory';
import {
  buildProductNameSnapshot,
  type Sale,
  type SaleCatalogItem,
  type SaleCreateInput,
  type SaleItem,
  type SalePaymentMethod,
  type SaleStatus,
  type SaleWithItems,
} from './types';

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
 * Core 판매 서비스.
 * 저장 전 재고 부족 검증 → sale/items 기록 → stock_movements(sale) + inventory 차감.
 * 포인트 ledger·Finance는 호출하지 않음(Module 책임).
 */
export const saleService = {
  /** 판매중 상품·옵션 카탈로그 */
  async listCatalog(organizationId: string): Promise<SaleCatalogItem[]> {
    const client = ensureClient();
    const [productsRes, variantsRes] = await Promise.all([
      client
        .from('products')
        .select('id, name, product_code, price, is_active')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name', { ascending: true }),
      client.from('product_variants').select('id, product_id, name, price, is_active'),
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
    return stockSaleOps.checkShortfalls(organizationId, lines);
  },

  async getSaleWithItems(
    organizationId: string,
    saleId: string
  ): Promise<SaleWithItems | null> {
    const client = ensureClient();
    const { data: saleRow, error: saleError } = await client
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .eq('organization_id', organizationId)
      .maybeSingle();
    if (saleError) throw saleError;
    if (!saleRow) return null;

    const { data: itemRows, error: itemsError } = await client
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId)
      .order('id', { ascending: true });
    if (itemsError) throw itemsError;

    return {
      ...mapSale(saleRow as SaleRow),
      items: ((itemRows as SaleItemRow[] | null) ?? []).map(mapSaleItem),
    };
  },

  /**
   * 판매 생성: 재고 부족 시 거부 → 헤더/라인 저장 → 재고 차감.
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
        item.productNameSnapshot.trim() || buildProductNameSnapshot('상품', null);
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

    const shortfalls = await this.checkStockShortfalls(input.organizationId, input.items);
    if (shortfalls.length > 0) {
      const detail = shortfalls
        .map((s) => `${s.label}(필요 ${s.required}, 재고 ${s.available})`)
        .join(', ');
      throw new Error(`재고가 부족합니다: ${detail}`);
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
    await stockSaleOps.applyDeductions(input.organizationId, saleId, deductLines);

    return {
      ...mapSale(saleRow as SaleRow),
      items: ((itemRows as SaleItemRow[] | null) ?? []).map(mapSaleItem),
    };
  },
};
