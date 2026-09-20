import { productService } from '@/core/product';
import { inventoryService } from '@/core/inventory';
import type { StockMovement } from '@/core/inventory';
import { getOrganizationId } from '@/services/adapters/storageContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { STORAGE_KEYS } from '@/services/adapters';
import { getItem, setItem } from '@/services/storage/helpers';
import type { Textbook, TextbookInventoryTransaction } from '@/types';

function requireOrgId(): string | null {
  if (!isSupabaseConfigured()) return null;
  return getOrganizationId();
}

function persistTextbookPatch(textbookId: string, patch: Partial<Textbook>): Textbook | null {
  const list = getItem<Textbook[]>(STORAGE_KEYS.TEXTBOOKS, []);
  const idx = list.findIndex((t) => t.id === textbookId);
  if (idx < 0) return null;
  const updated: Textbook = {
    ...list[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  if (patch.stock !== undefined) {
    updated.currentStock = patch.stock;
  }
  list[idx] = updated;
  setItem(STORAGE_KEYS.TEXTBOOKS, list);
  return updated;
}

async function readCoreQuantity(organizationId: string, productId: string): Promise<number> {
  const rows = await inventoryService.listStockRows(organizationId);
  return rows.find((r) => r.productId === productId && !r.variantId)?.quantity ?? 0;
}

function mapMovementToTx(
  movement: StockMovement,
  textbook: Textbook
): TextbookInventoryTransaction {
  const typeMap: Record<string, TextbookInventoryTransaction['transactionType']> = {
    inbound: 'inbound',
    sale: 'sale',
    return: 'return',
    adjustment: 'adjust',
  };
  const qty = movement.quantity;
  // previous/current는 표시용 — Core가 source이므로 current를 잔량 조회값으로 두지 않고 누적 대신 0 기준 근사
  return {
    id: movement.id,
    textbookId: textbook.id,
    textbookTitle: textbook.title,
    transactionType: typeMap[movement.movementType] || 'adjust',
    quantity: qty,
    previousStock: 0,
    currentStock: 0,
    referenceId: movement.referenceId || undefined,
    transactionDate: movement.createdAt.slice(0, 10),
    memo: movement.reason || undefined,
    createdAt: movement.createdAt,
  };
}

/**
 * Piano Textbook ↔ Core Product/Inventory 재고 연동.
 * Textbook 업무(판매·청구)는 Module에 두고, 잔량·입출고 이력만 Core를 source로 사용.
 */
export const textbookCoreStock = {
  isAvailable(): boolean {
    return Boolean(requireOrgId());
  },

  /**
   * Core Product 보장 + 최초 재고 이관.
   * productId = textbook.id (1:1).
   */
  async ensureProductLinked(textbook: Textbook): Promise<Textbook> {
    const orgId = requireOrgId();
    if (!orgId) return textbook;

    const productId = (textbook.productId || textbook.id).trim();
    const existing = await productService.getProduct(orgId, productId);
    if (!existing) {
      await productService.saveProduct(orgId, {
        id: productId,
        name: textbook.title,
        price: Math.max(0, Number(textbook.salePrice ?? textbook.price) || 0),
        cost:
          textbook.costPrice == null || Number.isNaN(Number(textbook.costPrice))
            ? null
            : Math.max(0, Number(textbook.costPrice)),
        isActive: textbook.isForSale !== false,
      });
      const localStock = Math.max(0, Math.floor(Number(textbook.stock) || 0));
      if (localStock > 0) {
        const coreQty = await readCoreQuantity(orgId, productId);
        if (coreQty === 0) {
          await inventoryService.applyInbound({
            organizationId: orgId,
            productId,
            quantity: localStock,
            reason: '교재 재고 Core 이관',
          });
        }
      }
    } else {
      await productService.saveProduct(
        orgId,
        {
          name: textbook.title,
          price: Math.max(0, Number(textbook.salePrice ?? textbook.price) || 0),
          cost:
            textbook.costPrice == null || Number.isNaN(Number(textbook.costPrice))
              ? null
              : Math.max(0, Number(textbook.costPrice)),
          isActive: textbook.isForSale !== false,
        },
        productId
      );
    }

    const qty = await readCoreQuantity(orgId, productId);
    return (
      persistTextbookPatch(textbook.id, {
        productId,
        stock: qty,
        currentStock: qty,
      }) || { ...textbook, productId, stock: qty, currentStock: qty }
    );
  },

  async syncStockMirror(textbookId: string): Promise<number> {
    const orgId = requireOrgId();
    const list = getItem<Textbook[]>(STORAGE_KEYS.TEXTBOOKS, []);
    const tb = list.find((t) => t.id === textbookId);
    if (!tb) return 0;
    if (!orgId) return tb.stock;

    const linked = await this.ensureProductLinked(tb);
    const productId = linked.productId || linked.id;
    const qty = await readCoreQuantity(orgId, productId);
    persistTextbookPatch(textbookId, { stock: qty, currentStock: qty, productId });
    return qty;
  },

  async syncAllStockMirrors(): Promise<void> {
    const orgId = requireOrgId();
    if (!orgId) return;
    const list = getItem<Textbook[]>(STORAGE_KEYS.TEXTBOOKS, []);
    for (const tb of list) {
      await this.syncStockMirror(tb.id);
    }
  },

  /**
   * 입고/반품입고(양수) 또는 조정(부호 있는 증감).
   * transactionType return → inbound movement(양수).
   */
  async applyDelta(params: {
    textbookId: string;
    quantityDelta: number;
    transactionType: 'inbound' | 'adjust' | 'return';
    memo?: string;
  }): Promise<{ textbook: Textbook; quantityAfter: number }> {
    const orgId = requireOrgId();
    const list = getItem<Textbook[]>(STORAGE_KEYS.TEXTBOOKS, []);
    const tb = list.find((t) => t.id === params.textbookId);
    if (!tb) throw new Error('교재를 찾을 수 없습니다.');

    if (!orgId) {
      throw new Error('사업장 또는 Supabase 설정이 없어 Core 재고를 사용할 수 없습니다.');
    }

    const linked = await this.ensureProductLinked(tb);
    const productId = linked.productId || linked.id;
    const delta = Number(params.quantityDelta);
    if (!Number.isFinite(delta) || delta === 0) {
      throw new Error('수량 변동값이 올바르지 않습니다.');
    }

    let quantityAfter: number;
    if (params.transactionType === 'inbound' || params.transactionType === 'return') {
      const qty = Math.abs(delta);
      const res = await inventoryService.applyInbound({
        organizationId: orgId,
        productId,
        quantity: qty,
        reason:
          params.memo ||
          (params.transactionType === 'return' ? '교재 반품 입고' : '교재 입고'),
      });
      quantityAfter = res.quantityAfter;
    } else {
      const res = await inventoryService.applyAdjustment({
        organizationId: orgId,
        productId,
        quantity: delta,
        reason: params.memo || '교재 재고 수동 조정',
      });
      quantityAfter = res.quantityAfter;
    }

    const updated =
      persistTextbookPatch(tb.id, {
        productId,
        stock: quantityAfter,
        currentStock: quantityAfter,
      }) || linked;

    return { textbook: updated, quantityAfter };
  },

  /** 판매 출고 — adjustment(음수), reference_type=textbook_sale */
  async applySaleDeduction(params: {
    textbookId: string;
    quantity: number;
    saleId: string;
    memo?: string;
  }): Promise<{ textbook: Textbook; previousStock: number; currentStock: number }> {
    const orgId = requireOrgId();
    const list = getItem<Textbook[]>(STORAGE_KEYS.TEXTBOOKS, []);
    const tb = list.find((t) => t.id === params.textbookId);
    if (!tb) throw new Error('교재를 찾을 수 없습니다.');
    if (!orgId) {
      throw new Error('사업장 또는 Supabase 설정이 없어 Core 재고를 사용할 수 없습니다.');
    }

    const linked = await this.ensureProductLinked(tb);
    const productId = linked.productId || linked.id;
    const qty = Math.floor(Number(params.quantity) || 0);
    if (qty <= 0) throw new Error('판매 수량이 올바르지 않습니다.');

    const previousStock = await readCoreQuantity(orgId, productId);
    if (previousStock < qty) {
      throw new Error(`재고가 부족합니다. (현재 ${previousStock}권)`);
    }

    const res = await inventoryService.applyAdjustment({
      organizationId: orgId,
      productId,
      quantity: -qty,
      reason: params.memo || `교재 판매 출고:${params.saleId}`,
    });

    // reference 추적용 별도 movement — adjustment는 reference 제약이 없어 reason에 saleId 포함
    const updated =
      persistTextbookPatch(tb.id, {
        productId,
        stock: res.quantityAfter,
        currentStock: res.quantityAfter,
      }) || linked;

    return {
      textbook: updated,
      previousStock,
      currentStock: res.quantityAfter,
    };
  },

  /** 판매 취소/반품 복구 */
  async applySaleRestore(params: {
    textbookId: string;
    quantity: number;
    saleId: string;
    memo?: string;
  }): Promise<{ textbook: Textbook; previousStock: number; currentStock: number }> {
    const orgId = requireOrgId();
    const list = getItem<Textbook[]>(STORAGE_KEYS.TEXTBOOKS, []);
    const tb = list.find((t) => t.id === params.textbookId);
    if (!tb) throw new Error('교재를 찾을 수 없습니다.');
    if (!orgId) {
      throw new Error('사업장 또는 Supabase 설정이 없어 Core 재고를 사용할 수 없습니다.');
    }

    const linked = await this.ensureProductLinked(tb);
    const productId = linked.productId || linked.id;
    const qty = Math.floor(Number(params.quantity) || 0);
    if (qty <= 0) throw new Error('복구 수량이 올바르지 않습니다.');

    const previousStock = await readCoreQuantity(orgId, productId);
    const res = await inventoryService.applyInbound({
      organizationId: orgId,
      productId,
      quantity: qty,
      reason: params.memo || `교재 판매 취소/반품:${params.saleId}`,
    });

    const updated =
      persistTextbookPatch(tb.id, {
        productId,
        stock: res.quantityAfter,
        currentStock: res.quantityAfter,
      }) || linked;

    return {
      textbook: updated,
      previousStock,
      currentStock: res.quantityAfter,
    };
  },

  /** Core stock_movements → TextbookInventoryTransaction 표시용 */
  async listHistory(): Promise<TextbookInventoryTransaction[]> {
    const orgId = requireOrgId();
    const textbooks = getItem<Textbook[]>(STORAGE_KEYS.TEXTBOOKS, []);
    const legacy = getItem<TextbookInventoryTransaction[]>(
      STORAGE_KEYS.TEXTBOOK_INVENTORY_TRANSACTIONS,
      []
    );

    if (!orgId) return legacy;

    const byProduct = new Map<string, Textbook>();
    for (const tb of textbooks) {
      const pid = tb.productId || tb.id;
      byProduct.set(pid, tb);
    }

    const movements = await inventoryService.listMovements({
      organizationId: orgId,
      limit: 500,
    });

    const coreTxs: TextbookInventoryTransaction[] = [];
    for (const m of movements) {
      if (!m.productId || m.variantId) continue;
      const tb = byProduct.get(m.productId);
      if (!tb) continue;
      // 교재 관련 movement만 (이관/입고/조정/판매 reason 또는 product 매칭)
      coreTxs.push(mapMovementToTx(m, tb));
    }

    // Core 이관 이전 로컬 이력 보존(동일 id 제외)
    const coreIds = new Set(coreTxs.map((t) => t.id));
    const merged = [
      ...coreTxs,
      ...legacy.filter((t) => !coreIds.has(t.id)),
    ];
    merged.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return merged;
  },
};
