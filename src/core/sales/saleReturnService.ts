import { getCoreClient, isSupabaseConfigured } from '@/lib/supabase';
import { stockSaleOps, type SaleStockDeductLine } from '@/core/inventory';
import type { SaleItem } from './types';
import {
  computeReturnLineAmount,
  type SaleItemReturnable,
  type SaleReturn,
  type SaleReturnCreateInput,
  type SaleReturnItem,
  type SaleReturnWithItems,
} from './types';

type ReturnRow = {
  id: string;
  organization_id: string;
  sale_id: string;
  total_amount: number | string;
  reason: string | null;
  created_at: string;
};

type ReturnItemRow = {
  id: string;
  sale_return_id: string;
  sale_item_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  quantity: number | string;
  unit_price: number | string;
  line_amount: number | string;
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

function mapReturn(row: ReturnRow): SaleReturn {
  return {
    id: row.id,
    organizationId: row.organization_id,
    saleId: row.sale_id,
    totalAmount: toNumber(row.total_amount),
    reason: row.reason,
    createdAt: row.created_at,
  };
}

function mapReturnItem(row: ReturnItemRow): SaleReturnItem {
  return {
    id: row.id,
    saleReturnId: row.sale_return_id,
    saleItemId: row.sale_item_id,
    productId: row.product_id,
    variantId: row.variant_id,
    productNameSnapshot: row.product_name_snapshot,
    quantity: toNumber(row.quantity),
    unitPrice: toNumber(row.unit_price),
    lineAmount: toNumber(row.line_amount),
  };
}

/**
 * Core 반품 서비스.
 * 원본 Sale 불변. 재고는 stock_movements(return)로 복구.
 */
export const saleReturnService = {
  async getReturnedQtyBySaleItem(
    organizationId: string,
    saleId: string
  ): Promise<Map<string, number>> {
    const client = ensureClient();
    const { data: returns, error: retError } = await client
      .from('sale_returns')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('sale_id', saleId);
    if (retError) throw retError;

    const returnIds = ((returns as { id: string }[] | null) ?? []).map((r) => r.id);
    const map = new Map<string, number>();
    if (returnIds.length === 0) return map;

    const { data: items, error: itemsError } = await client
      .from('sale_return_items')
      .select('sale_item_id, quantity')
      .in('sale_return_id', returnIds);
    if (itemsError) throw itemsError;

    for (const row of (items as { sale_item_id: string; quantity: number | string }[] | null) ??
      []) {
      const prev = map.get(row.sale_item_id) ?? 0;
      map.set(row.sale_item_id, prev + toNumber(row.quantity));
    }
    return map;
  },

  buildReturnableLines(
    saleItems: SaleItem[],
    returnedByItem: Map<string, number>
  ): SaleItemReturnable[] {
    return saleItems.map((item) => {
      const soldQuantity = toNumber(item.quantity);
      const returnedQuantity = returnedByItem.get(item.id) ?? 0;
      const remainingQuantity = Math.max(0, soldQuantity - returnedQuantity);
      return {
        saleItemId: item.id,
        productNameSnapshot: item.productNameSnapshot,
        productId: item.productId,
        variantId: item.variantId,
        soldQuantity,
        returnedQuantity,
        remainingQuantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        lineAmount: item.lineAmount,
      };
    });
  },

  async listReturnsForSale(
    organizationId: string,
    saleId: string
  ): Promise<SaleReturnWithItems[]> {
    const client = ensureClient();
    const { data: returnRows, error: retError } = await client
      .from('sale_returns')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('sale_id', saleId)
      .order('created_at', { ascending: false });
    if (retError) throw retError;

    const returns = (returnRows as ReturnRow[] | null) ?? [];
    if (returns.length === 0) return [];

    const returnIds = returns.map((r) => r.id);
    const { data: itemRows, error: itemsError } = await client
      .from('sale_return_items')
      .select('*')
      .in('sale_return_id', returnIds)
      .order('id', { ascending: true });
    if (itemsError) throw itemsError;

    const itemsByReturn = new Map<string, ReturnItemRow[]>();
    for (const row of (itemRows as ReturnItemRow[] | null) ?? []) {
      const list = itemsByReturn.get(row.sale_return_id) ?? [];
      list.push(row);
      itemsByReturn.set(row.sale_return_id, list);
    }

    return returns.map((row) => ({
      ...mapReturn(row),
      items: (itemsByReturn.get(row.id) ?? []).map(mapReturnItem),
    }));
  },

  async createReturn(input: SaleReturnCreateInput): Promise<SaleReturnWithItems> {
    const client = ensureClient();
    const orgId = input.organizationId?.trim();
    const saleId = input.saleId?.trim();
    if (!orgId || !saleId) {
      throw new Error('사업장·판매 정보가 필요합니다.');
    }
    if (!input.items.length) {
      throw new Error('반품할 상품을 선택해 주세요.');
    }

    const { data: saleRow, error: saleError } = await client
      .from('sales')
      .select('id, organization_id, status')
      .eq('id', saleId)
      .eq('organization_id', orgId)
      .maybeSingle();
    if (saleError) throw saleError;
    if (!saleRow) throw new Error('판매 내역을 찾을 수 없습니다.');

    const { data: saleItems, error: itemsError } = await client
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId);
    if (itemsError) throw itemsError;

    const itemById = new Map(
      ((saleItems as Array<{
        id: string;
        product_id: string | null;
        variant_id: string | null;
        product_name_snapshot: string;
        quantity: number | string;
        unit_price: number | string;
        discount_amount: number | string;
        line_amount: number | string;
      }> | null) ?? []).map((row) => [row.id, row])
    );

    const returnedByItem = await this.getReturnedQtyBySaleItem(orgId, saleId);

    const prepared: Array<{
      saleItemId: string;
      productId: string | null;
      variantId: string | null;
      productNameSnapshot: string;
      quantity: number;
      unitPrice: number;
      lineAmount: number;
    }> = [];

    for (const line of input.items) {
      const qty = Math.floor(Number(line.quantity) || 0);
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error('반품 수량은 1 이상의 정수여야 합니다.');
      }
      const src = itemById.get(line.saleItemId);
      if (!src) {
        throw new Error('원본 판매 상품을 찾을 수 없습니다.');
      }
      const soldQty = toNumber(src.quantity);
      const already = returnedByItem.get(src.id) ?? 0;
      const remaining = soldQty - already;
      if (qty > remaining) {
        throw new Error(
          `"${src.product_name_snapshot}" 반품 가능 수량은 ${remaining}개입니다.`
        );
      }
      const unitPrice = toNumber(src.unit_price);
      const lineAmount = computeReturnLineAmount({
        returnQty: qty,
        soldQty,
        unitPrice,
        discountAmount: toNumber(src.discount_amount),
      });
      prepared.push({
        saleItemId: src.id,
        productId: src.product_id,
        variantId: src.variant_id,
        productNameSnapshot: src.product_name_snapshot,
        quantity: qty,
        unitPrice,
        lineAmount,
      });
    }

    const totalAmount = prepared.reduce((sum, row) => sum + row.lineAmount, 0);

    const { data: returnRow, error: insertError } = await client
      .from('sale_returns')
      .insert({
        organization_id: orgId,
        sale_id: saleId,
        total_amount: totalAmount,
        reason: input.reason?.trim() || null,
      })
      .select('*')
      .single();
    if (insertError) throw insertError;

    const saleReturnId = (returnRow as ReturnRow).id;
    const { data: returnItemRows, error: returnItemsError } = await client
      .from('sale_return_items')
      .insert(
        prepared.map((row) => ({
          sale_return_id: saleReturnId,
          sale_item_id: row.saleItemId,
          product_id: row.productId,
          variant_id: row.variantId,
          product_name_snapshot: row.productNameSnapshot,
          quantity: row.quantity,
          unit_price: row.unitPrice,
          line_amount: row.lineAmount,
        }))
      )
      .select('*');
    if (returnItemsError) throw returnItemsError;

    const stockLines: SaleStockDeductLine[] = prepared
      .filter((row) => row.productId)
      .map((row) => ({
        productId: row.productId as string,
        variantId: row.variantId,
        quantity: row.quantity,
        label: row.productNameSnapshot,
      }));

    if (stockLines.length > 0) {
      await stockSaleOps.applyReturns(orgId, saleReturnId, stockLines);
    }

    return {
      ...mapReturn(returnRow as ReturnRow),
      items: ((returnItemRows as ReturnItemRow[] | null) ?? []).map(mapReturnItem),
    };
  },
};
