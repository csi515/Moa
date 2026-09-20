import { saleService as coreSaleService } from '@/core/sales';
import { pointEarnService } from '@/core/loyalty/pointEarnService';
import { pointRedeemService } from '@/core/loyalty/pointRedeemService';
import type { SaleCreateInput, SaleWithItems } from '../types/sale';
import type { StockShortfall } from '../types/inventory';

/**
 * Retail 판매 서비스.
 * 상품·재고·판매 기록은 Core, 포인트 사용/적립은 Loyalty에 연결.
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
    const sale = await coreSaleService.createSale(input);

    if (sale.pointsUsed > 0) {
      await pointRedeemService.redeemForSale({
        organizationId: input.organizationId,
        customerId: input.customerId,
        saleId: sale.id,
        pointsToUse: sale.pointsUsed,
        saleTotalAmount: sale.totalAmount,
      });
    }

    const eligibleEarnAmount = Math.max(0, sale.totalAmount - sale.pointsUsed);
    try {
      await pointEarnService.earnForSale({
        organizationId: input.organizationId,
        customerId: input.customerId,
        saleId: sale.id,
        eligibleAmount: eligibleEarnAmount,
      });
    } catch (earnError) {
      console.error('[saleService.createSale] point earn failed', earnError);
    }

    return sale;
  },
};
