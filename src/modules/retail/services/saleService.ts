import { saleService as coreSaleService } from '@/core/sales';
import { pointEarnService } from '@/core/loyalty/pointEarnService';
import type { SaleCreateInput, SaleWithItems } from '../types/sale';
import type { StockShortfall } from '../types/inventory';

/**
 * Retail 판매 서비스.
 * 상품·재고·판매·포인트 사용(redeem)은 Core create_sale 원자 RPC.
 * 적립(earn)은 판매 확정 후 best-effort (실패해도 판매·redeem 일관 유지).
 */
export const saleService = {
  listCatalog: coreSaleService.listCatalog.bind(coreSaleService),

  checkStockShortfalls(
    organizationId: string,
    items: SaleCreateInput['items']
  ): Promise<StockShortfall[]> {
    return coreSaleService.checkStockShortfalls(organizationId, items);
  },

  async createSale(input: SaleCreateInput): Promise<SaleWithItems> {
    // points_used > 0 이면 create_sale 내부에서 redeem까지 원자 처리
    // (부족/비활성 시 판매·재고 전체 rollback)
    const sale = await coreSaleService.createSale(input);

    const eligibleEarnAmount = Math.max(0, sale.totalAmount - sale.pointsUsed);
    try {
      await pointEarnService.earnForSale({
        organizationId: input.organizationId,
        customerId: input.customerId,
        saleId: sale.id,
        eligibleAmount: eligibleEarnAmount,
      });
    } catch (earnError) {
      // 판매·redeem은 이미 확정. 적립만 실패 — 재시도 시 sale_id 멱등으로 중복 방지
      console.error('[saleService.createSale] point earn failed', earnError);
    }

    return sale;
  },
};
