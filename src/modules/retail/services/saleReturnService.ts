import { saleReturnService as coreSaleReturnService } from '@/core/sales';
import type { SaleReturnCreateInput, SaleReturnWithItems } from '@/core/sales';
import { pointReturnService } from '@/core/loyalty';

/**
 * Retail 반품 서비스.
 * Core create_sale_return(재고) 후 Loyalty 포인트 보정.
 * 포인트 실패 시에도 반품 본문은 유지 — 동일 returnId로 reverseForSaleReturn 재처리.
 */
export const saleReturnService = {
  getReturnedQtyBySaleItem: coreSaleReturnService.getReturnedQtyBySaleItem.bind(
    coreSaleReturnService
  ),
  buildReturnableLines: coreSaleReturnService.buildReturnableLines.bind(
    coreSaleReturnService
  ),

  async listReturnsForSale(organizationId: string, saleId: string) {
    const returns = await coreSaleReturnService.listReturnsForSale(
      organizationId,
      saleId
    );
    // 미완료 포인트 보정 기회적 재처리 (멱등 · 이미 처리된 부호는 no-op)
    for (const row of returns) {
      try {
        await pointReturnService.reverseForSaleReturn({
          organizationId,
          saleId,
          returnId: row.id,
          returnAmount: row.totalAmount,
        });
      } catch (err) {
        console.error(
          '[retail.saleReturnService.listReturnsForSale] point reverse retry',
          row.id,
          err
        );
      }
    }
    return returns;
  },

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
      // Core 반품은 이미 완료. 포인트만 미처리일 수 있음 — 반품 재생성 금지.
      // listReturnsForSale / reverseForSaleReturn(returnId) 로 재처리.
      console.error(
        '[retail.saleReturnService.createReturn] point reverse failed; return kept',
        { returnId: result.id, saleId: result.saleId, err }
      );
    }

    return result;
  },
};
