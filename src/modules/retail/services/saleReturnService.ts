import { saleReturnService as coreSaleReturnService } from '@/core/sales';
import type { SaleReturnCreateInput, SaleReturnWithItems } from '@/core/sales';
import { pointReturnService } from '@/core/loyalty';

/**
 * Retail 반품 서비스.
 * Core create_sale_return(재고) 후 Loyalty 포인트 적립 취소·사용 복구.
 * Finance IncomeEntry는 Retail에서 사용하지 않음(매출은 sales/sale_returns 집계).
 */
export const saleReturnService = {
  getReturnedQtyBySaleItem: coreSaleReturnService.getReturnedQtyBySaleItem.bind(
    coreSaleReturnService
  ),
  buildReturnableLines: coreSaleReturnService.buildReturnableLines.bind(
    coreSaleReturnService
  ),
  listReturnsForSale: coreSaleReturnService.listReturnsForSale.bind(
    coreSaleReturnService
  ),

  async createReturn(input: SaleReturnCreateInput): Promise<SaleReturnWithItems> {
    const result = await coreSaleReturnService.createReturn(input);

    try {
      await pointReturnService.reverseForSaleReturn({
        organizationId: input.organizationId,
        saleId: result.saleId,
        returnId: result.id,
        returnAmount: result.totalAmount,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error('[retail.saleReturnService.createReturn] point reverse failed', err);
      throw new Error(
        `반품은 완료되었으나 포인트 처리에 실패했습니다. ${detail}`
      );
    }

    return result;
  },
};
