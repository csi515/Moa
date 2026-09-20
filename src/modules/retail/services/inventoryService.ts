import { getCoreClient, isSupabaseConfigured } from '@/lib/supabase';
import type {
  InventoryStockRow,
  StockAdjustmentInput,
  StockInboundInput,
  StockMovement,
} from '../types/inventory';

type ProductRow = {
  id: string;
  name: string;
  product_code: string | null;
  is_active: boolean;
};

type VariantRow = {
  id: string;
  product_id: string;
  name: string;
  is_active: boolean;
};

type InventoryRow = {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  quantity: number | string;
};

type MovementRow = {
  id: string;
  organization_id: string;
  product_id: string | null;
  variant_id: string | null;
  movement_type: 'inbound' | 'sale' | 'return' | 'adjustment';
  quantity: number | string;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  created_at: string;
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

function mapMovement(row: MovementRow): StockMovement {
  return {
    id: row.id,
    organizationId: row.organization_id,
    productId: row.product_id,
    variantId: row.variant_id,
    movementType: row.movement_type,
    quantity: toNumber(row.quantity),
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

/**
 * 재고 조회·입고.
 * 잔량 변경은 StockMovement 기록 후 Inventory에 가산(덮어쓰기 금지).
 */
export const inventoryService = {
  async listStockRows(organizationId: string): Promise<InventoryStockRow[]> {
    const client = ensureClient();

    const [productsRes, variantsRes, inventoryRes] = await Promise.all([
      client
        .from('products')
        .select('id, name, product_code, is_active')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true }),
      client.from('product_variants').select('id, product_id, name, is_active'),
      client
        .from('inventory')
        .select('id, product_id, variant_id, quantity')
        .eq('organization_id', organizationId),
    ]);

    if (productsRes.error) throw productsRes.error;
    if (variantsRes.error) throw variantsRes.error;
    if (inventoryRes.error) throw inventoryRes.error;

    const products = (productsRes.data as ProductRow[] | null) ?? [];
    const productIds = new Set(products.map((p) => p.id));

    const variantsByProduct = new Map<string, VariantRow[]>();
    for (const v of (variantsRes.data as VariantRow[] | null) ?? []) {
      if (!productIds.has(v.product_id)) continue;
      const list = variantsByProduct.get(v.product_id) ?? [];
      list.push(v);
      variantsByProduct.set(v.product_id, list);
    }

    const qtyByVariant = new Map<string, number>();
    const qtyByProductOnly = new Map<string, number>();
    for (const row of (inventoryRes.data as InventoryRow[] | null) ?? []) {
      const qty = toNumber(row.quantity);
      if (row.variant_id) {
        qtyByVariant.set(row.variant_id, qty);
      } else if (row.product_id) {
        qtyByProductOnly.set(row.product_id, qty);
      }
    }

    const rows: InventoryStockRow[] = [];

    for (const product of products) {
      const variants = variantsByProduct.get(product.id) ?? [];
      if (variants.length > 0) {
        const sorted = [...variants].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        for (const variant of sorted) {
          rows.push({
            key: `v:${variant.id}`,
            productId: product.id,
            productName: product.name,
            productCode: product.product_code,
            variantId: variant.id,
            variantName: variant.name,
            quantity: qtyByVariant.get(variant.id) ?? 0,
            isActive: variant.is_active && product.is_active,
            productIsActive: product.is_active,
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
          quantity: qtyByProductOnly.get(product.id) ?? 0,
          isActive: product.is_active,
          productIsActive: product.is_active,
        });
      }
    }

    return rows;
  },

  /**
   * 입고 완료: StockMovement(inbound) 저장 → Inventory 수량 가산.
   * 폼에서 잔량을 직접 지정하지 않는다.
   */
  async applyInbound(input: StockInboundInput): Promise<{
    movement: StockMovement;
    quantityAfter: number;
  }> {
    const client = ensureClient();
    const qty = Number(input.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error('입고 수량은 0보다 커야 합니다.');
    }
    if (!input.productId) {
      throw new Error('상품을 선택해 주세요.');
    }

    const variantId = input.variantId || null;

    // 상품이 해당 사업장 소속인지 확인
    const { data: product, error: productError } = await client
      .from('products')
      .select('id')
      .eq('id', input.productId)
      .eq('organization_id', input.organizationId)
      .maybeSingle();
    if (productError) throw productError;
    if (!product) throw new Error('상품을 찾을 수 없습니다.');

    if (variantId) {
      const { data: variant, error: variantError } = await client
        .from('product_variants')
        .select('id, product_id')
        .eq('id', variantId)
        .maybeSingle();
      if (variantError) throw variantError;
      if (!variant || variant.product_id !== input.productId) {
        throw new Error('선택한 옵션이 상품과 일치하지 않습니다.');
      }
    }

    const { data: movementRow, error: movementError } = await client
      .from('stock_movements')
      .insert({
        organization_id: input.organizationId,
        product_id: input.productId,
        variant_id: variantId,
        movement_type: 'inbound',
        quantity: qty,
        reason: input.reason?.trim() || null,
      })
      .select('*')
      .single();
    if (movementError) throw movementError;

    // 기존 잔량 조회 후 가산 (절대값 덮어쓰기 금지)
    let existingQuery = client
      .from('inventory')
      .select('id, quantity')
      .eq('organization_id', input.organizationId)
      .eq('product_id', input.productId);

    if (variantId) {
      existingQuery = existingQuery.eq('variant_id', variantId);
    } else {
      existingQuery = existingQuery.is('variant_id', null);
    }

    const { data: existing, error: findError } = await existingQuery.maybeSingle();
    if (findError) throw findError;

    let quantityAfter: number;
    if (existing) {
      quantityAfter = toNumber(existing.quantity) + qty;
      const { error: updateError } = await client
        .from('inventory')
        .update({ quantity: quantityAfter })
        .eq('id', existing.id)
        .eq('organization_id', input.organizationId);
      if (updateError) throw updateError;
    } else {
      quantityAfter = qty;
      const { error: insertError } = await client.from('inventory').insert({
        organization_id: input.organizationId,
        product_id: input.productId,
        variant_id: variantId,
        quantity: quantityAfter,
      });
      if (insertError) throw insertError;
    }

    return {
      movement: mapMovement(movementRow as MovementRow),
      quantityAfter,
    };
  },

  /**
   * 재고 조정: StockMovement(adjustment) 저장 → Inventory에 부호 있는 증감 반영.
   * 잔량 절대값 덮어쓰기 금지. 사유 필수.
   */
  async applyAdjustment(input: StockAdjustmentInput): Promise<{
    movement: StockMovement;
    quantityAfter: number;
  }> {
    const client = ensureClient();
    const delta = Number(input.quantity);
    if (!Number.isFinite(delta) || delta === 0 || !Number.isInteger(delta)) {
      throw new Error('조정 수량은 0이 아닌 정수여야 합니다.');
    }
    if (!input.productId) {
      throw new Error('상품을 선택해 주세요.');
    }
    const reason = input.reason?.trim();
    if (!reason) {
      throw new Error('조정 사유를 입력해 주세요.');
    }

    const variantId = input.variantId || null;

    const { data: product, error: productError } = await client
      .from('products')
      .select('id')
      .eq('id', input.productId)
      .eq('organization_id', input.organizationId)
      .maybeSingle();
    if (productError) throw productError;
    if (!product) throw new Error('상품을 찾을 수 없습니다.');

    if (variantId) {
      const { data: variant, error: variantError } = await client
        .from('product_variants')
        .select('id, product_id')
        .eq('id', variantId)
        .maybeSingle();
      if (variantError) throw variantError;
      if (!variant || variant.product_id !== input.productId) {
        throw new Error('선택한 옵션이 상품과 일치하지 않습니다.');
      }
    }

    let existingQuery = client
      .from('inventory')
      .select('id, quantity')
      .eq('organization_id', input.organizationId)
      .eq('product_id', input.productId);

    if (variantId) {
      existingQuery = existingQuery.eq('variant_id', variantId);
    } else {
      existingQuery = existingQuery.is('variant_id', null);
    }

    const { data: existing, error: findError } = await existingQuery.maybeSingle();
    if (findError) throw findError;

    const currentQty = existing ? toNumber(existing.quantity) : 0;
    const quantityAfter = currentQty + delta;
    if (quantityAfter < 0) {
      throw new Error(
        `조정 후 재고가 음수가 됩니다. (현재 ${currentQty}, 조정 ${delta})`
      );
    }

    const { data: movementRow, error: movementError } = await client
      .from('stock_movements')
      .insert({
        organization_id: input.organizationId,
        product_id: input.productId,
        variant_id: variantId,
        movement_type: 'adjustment',
        quantity: delta,
        reason,
      })
      .select('*')
      .single();
    if (movementError) throw movementError;

    if (existing) {
      const { error: updateError } = await client
        .from('inventory')
        .update({ quantity: quantityAfter })
        .eq('id', existing.id)
        .eq('organization_id', input.organizationId);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await client.from('inventory').insert({
        organization_id: input.organizationId,
        product_id: input.productId,
        variant_id: variantId,
        quantity: quantityAfter,
      });
      if (insertError) throw insertError;
    }

    return {
      movement: mapMovement(movementRow as MovementRow),
      quantityAfter,
    };
  },
};
