import { getCoreClient, isSupabaseConfigured } from '@/lib/supabase';
import type { SaleStockDeductLine, StockShortfall } from '../types/inventory';

type InventoryRow = {
  id: string;
  quantity: number | string;
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

async function findInventoryRow(
  organizationId: string,
  productId: string,
  variantId: string | null
): Promise<InventoryRow | null> {
  const client = ensureClient();
  let query = client
    .from('inventory')
    .select('id, quantity')
    .eq('organization_id', organizationId)
    .eq('product_id', productId);

  if (variantId) {
    query = query.eq('variant_id', variantId);
  } else {
    query = query.is('variant_id', null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return (data as InventoryRow | null) ?? null;
}

/**
 * 판매 재고 확인·차감.
 * 정책: Retail 상품/옵션은 전부 재고 관리 대상(미관리 플래그 없음).
 * StockMovement(sale, 음수) 기록 후 Inventory 가감.
 */
export const inventorySaleStock = {
  async checkShortfalls(
    organizationId: string,
    lines: SaleStockDeductLine[]
  ): Promise<StockShortfall[]> {
    const shortfalls: StockShortfall[] = [];

    for (const line of lines) {
      const qty = Number(line.quantity);
      if (!Number.isFinite(qty) || qty <= 0) continue;
      const variantId = line.variantId || null;
      const existing = await findInventoryRow(organizationId, line.productId, variantId);
      const available = existing ? toNumber(existing.quantity) : 0;
      if (available < qty) {
        shortfalls.push({
          productId: line.productId,
          variantId,
          label: line.label,
          required: qty,
          available,
        });
      }
    }

    return shortfalls;
  },

  /**
   * 판매 완료 후 재고 차감.
   * movement_type=sale, quantity=음수, reference_type=sale.
   */
  async applyDeductions(
    organizationId: string,
    saleId: string,
    lines: SaleStockDeductLine[]
  ): Promise<void> {
    const client = ensureClient();

    for (const line of lines) {
      const qty = Number(line.quantity);
      if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
        throw new Error('판매 재고 차감 수량이 올바르지 않습니다.');
      }
      if (!line.productId) {
        throw new Error('판매 상품이 없습니다.');
      }

      const variantId = line.variantId || null;
      const delta = -qty;

      const { error: movementError } = await client.from('stock_movements').insert({
        organization_id: organizationId,
        product_id: line.productId,
        variant_id: variantId,
        movement_type: 'sale',
        quantity: delta,
        reference_type: 'sale',
        reference_id: saleId,
        reason: null,
      });
      if (movementError) throw movementError;

      const existing = await findInventoryRow(organizationId, line.productId, variantId);
      const currentQty = existing ? toNumber(existing.quantity) : 0;
      const quantityAfter = currentQty + delta;

      if (existing) {
        const { error: updateError } = await client
          .from('inventory')
          .update({ quantity: quantityAfter })
          .eq('id', existing.id)
          .eq('organization_id', organizationId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await client.from('inventory').insert({
          organization_id: organizationId,
          product_id: line.productId,
          variant_id: variantId,
          quantity: quantityAfter,
        });
        if (insertError) throw insertError;
      }
    }
  },

  /**
   * 반품 후 재고 복구.
   * movement_type=return, quantity=양수, reference_type=sale_return.
   * productId 없는 라인(삭제된 상품)은 스킵.
   */
  async applyReturns(
    organizationId: string,
    saleReturnId: string,
    lines: SaleStockDeductLine[]
  ): Promise<void> {
    const client = ensureClient();

    for (const line of lines) {
      const qty = Number(line.quantity);
      if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
        throw new Error('반품 재고 복구 수량이 올바르지 않습니다.');
      }
      if (!line.productId) {
        continue;
      }

      const variantId = line.variantId || null;
      const delta = qty;

      const { error: movementError } = await client.from('stock_movements').insert({
        organization_id: organizationId,
        product_id: line.productId,
        variant_id: variantId,
        movement_type: 'return',
        quantity: delta,
        reference_type: 'sale_return',
        reference_id: saleReturnId,
        reason: null,
      });
      if (movementError) throw movementError;

      const existing = await findInventoryRow(organizationId, line.productId, variantId);
      const currentQty = existing ? toNumber(existing.quantity) : 0;
      const quantityAfter = currentQty + delta;

      if (existing) {
        const { error: updateError } = await client
          .from('inventory')
          .update({ quantity: quantityAfter })
          .eq('id', existing.id)
          .eq('organization_id', organizationId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await client.from('inventory').insert({
          organization_id: organizationId,
          product_id: line.productId,
          variant_id: variantId,
          quantity: quantityAfter,
        });
        if (insertError) throw insertError;
      }
    }
  },
};
