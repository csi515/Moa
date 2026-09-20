import { getCoreClient, isSupabaseConfigured } from '@/lib/supabase';
import { findStockShortfalls, saleStockAggKey, aggregateSaleStockLines } from './saleStockAggregate';
import type { SaleStockDeductLine, StockShortfall } from './types';

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

export async function findInventoryRow(
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

async function applyInventoryDelta(
  organizationId: string,
  productId: string,
  variantId: string | null,
  delta: number
): Promise<number> {
  const client = ensureClient();
  const existing = await findInventoryRow(organizationId, productId, variantId);
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
      product_id: productId,
      variant_id: variantId,
      quantity: quantityAfter,
    });
    if (insertError) throw insertError;
  }
  return quantityAfter;
}

/**
 * 판매·반품용 재고 확인/차감/복구.
 * movement 기록 후 Inventory 가감 (절대값 덮어쓰기 금지).
 *
 * 주의: createSale 경로의 원자 차감은 core.create_sale RPC(FOR UPDATE)가 담당한다.
 * 이 모듈의 applyDeductions는 RPC 밖·레거시/보조 용도이며, 호출 전 합산 shortfall을 검증한다.
 */
export const stockSaleOps = {
  async checkShortfalls(
    organizationId: string,
    lines: SaleStockDeductLine[]
  ): Promise<StockShortfall[]> {
    // 동일 product+variant 합산 후 검증 (장바구니 중복 라인)
    const availableByKey = new Map<string, number>();
    const seen = new Set<string>();
    for (const line of lines) {
      const productId = String(line.productId || '').trim();
      if (!productId) continue;
      const variantId = line.variantId?.trim() ? line.variantId.trim() : null;
      const key = saleStockAggKey(productId, variantId);
      if (seen.has(key)) continue;
      seen.add(key);
      const existing = await findInventoryRow(organizationId, productId, variantId);
      availableByKey.set(key, existing ? toNumber(existing.quantity) : 0);
    }
    return findStockShortfalls(availableByKey, lines);
  },

  /**
   * movement_type=sale, quantity=음수, reference_type=sale.
   * 라인별 movement 유지 + 차감 전 합산 shortfall 검증.
   * 동시성 안전은 create_sale RPC의 FOR UPDATE를 사용한다.
   */
  async applyDeductions(
    organizationId: string,
    saleId: string,
    lines: SaleStockDeductLine[]
  ): Promise<void> {
    const shortfalls = await this.checkShortfalls(organizationId, lines);
    if (shortfalls.length > 0) {
      const detail = shortfalls
        .map((s) => `${s.label}(필요 ${s.required}, 재고 ${s.available})`)
        .join(', ');
      throw new Error(`재고가 부족합니다: ${detail}`);
    }

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

      const quantityAfter = await applyInventoryDelta(
        organizationId,
        line.productId,
        variantId,
        delta
      );
      if (quantityAfter < 0) {
        throw new Error('재고가 부족합니다');
      }
    }
  },

  /**
   * movement_type=return, quantity=양수, reference_type=sale_return.
   * 동일 product+variant 라인은 합산 후 복구(중복 라인 안전).
   * 동시 반품·누적 수량 검증의 원자성은 create_sale_return RPC(FOR UPDATE)가 담당한다.
   */
  async applyReturns(
    organizationId: string,
    saleReturnId: string,
    lines: SaleStockDeductLine[]
  ): Promise<void> {
    const client = ensureClient();
    // 합산: 같은 SKU가 여러 반품 라인에 있어도 inventory는 1회 복구
    const aggregated = aggregateSaleStockLines(lines);

    for (const line of aggregated) {
      const qty = Number(line.quantity);
      if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
        throw new Error('반품 재고 복구 수량이 올바르지 않습니다.');
      }
      if (!line.productId) {
        continue;
      }

      const variantId = line.variantId || null;

      const { error: movementError } = await client.from('stock_movements').insert({
        organization_id: organizationId,
        product_id: line.productId,
        variant_id: variantId,
        movement_type: 'return',
        quantity: qty,
        reference_type: 'sale_return',
        reference_id: saleReturnId,
        reason: null,
      });
      if (movementError) throw movementError;

      await applyInventoryDelta(organizationId, line.productId, variantId, qty);
    }
  },
};
