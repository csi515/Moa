import { productService } from '@/core/product';
import { inventoryService } from '@/core/inventory';
import { StorageService } from '@/services/storage';
import * as orgService from '@/core/organizations/services/organizationService';
import type { RetailProduct } from '@/types';

const MIGRATE_FLAG = 'skinRetailCoreMigratedAt' as const;

/**
 * 설정 JSON의 retailCatalog → Core products/inventory 1회 이관.
 * - retailCatalog 자체는 삭제하지 않음(복구·호환용 보존).
 * - 이미 Core에 동일 id 상품이 있으면 생성 스킵, 재고만 보정하지 않음(이중 입고 방지).
 */
export async function migrateSkinRetailCatalogIfNeeded(
  organizationId: string
): Promise<{ migrated: boolean; imported: number }> {
  const settings = StorageService.getSettings();
  if (settings.skinRetailCoreMigratedAt) {
    return { migrated: false, imported: 0 };
  }

  const catalog: RetailProduct[] = Array.isArray(settings.retailCatalog)
    ? settings.retailCatalog
    : [];

  let imported = 0;
  if (catalog.length > 0) {
    const existing = await productService.listProducts(organizationId);
    const existingIds = new Set(existing.map((p) => p.id));

    for (const item of catalog) {
      const id = (item.id || '').trim();
      const name = (item.name || '').trim();
      if (!id || !name) continue;

      if (!existingIds.has(id)) {
        await productService.saveProduct(organizationId, {
          id,
          name,
          price: Math.max(0, Number(item.price) || 0),
          isActive: true,
        });
        existingIds.add(id);
        imported += 1;

        const stock = Math.max(0, Math.floor(Number(item.stock) || 0));
        if (stock > 0) {
          await inventoryService.applyInbound({
            organizationId,
            productId: id,
            quantity: stock,
            reason: '레거시 카탈로그 이관',
          });
        }
      }
    }
  }

  const migratedAt = new Date().toISOString();
  StorageService.updateSettings({ [MIGRATE_FLAG]: migratedAt });
  try {
    await orgService.updateOrganization(organizationId, {
      settings: { [MIGRATE_FLAG]: migratedAt },
    });
  } catch {
    // 로컬 플래그는 유지 — 원격 실패 시 다음 진입에서 재시도하지 않도록(중복 입고 방지)
  }

  return { migrated: true, imported };
}
