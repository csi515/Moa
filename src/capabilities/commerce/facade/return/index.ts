/**
 * Commerce Return — 구현은 src/core/sales (create_sale_return).
 * 포인트 clawback은 core/loyalty. Retail 래퍼가 후처리한다.
 */
export type {
  SaleItemReturnable,
  SaleReturn,
  SaleReturnCreateInput,
  SaleReturnItem,
  SaleReturnWithItems,
} from '@/core/sales';
export {
  saleReturnService,
  computeReturnLineAmount,
  aggregateReturnRequestLines,
  assertReturnQuantitiesAllowed,
  mapCreateSaleReturnRpcError,
} from '@/core/sales';
