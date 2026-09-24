/**
 * Commerce 배럴이 Core 원장을 재export하고, Retail은 Commerce를 가리키는지 확인.
 * 실행: npm run test:commerce-barrel
 *
 * 서비스 모듈을 로드하지 않는다 (tsx에서 import.meta.env 미주입).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatSaleNumber } from './sale/saleQuery';
import {
  buildCommerceRevenueSummary,
  buildRetailRevenueSummary,
} from './sale/revenueAggregate';
import { SALE_PAYMENT_METHODS } from '@/core/sales/types';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

const productBarrel = readSrc('src/core/commerce/product/index.ts');
assert.match(productBarrel, /from '@\/core\/product'/);
assert.doesNotMatch(productBarrel, /from '@\/modules\//);

const inventoryBarrel = readSrc('src/core/commerce/inventory/index.ts');
assert.match(inventoryBarrel, /from '@\/core\/inventory'/);
assert.match(inventoryBarrel, /callApplyStockMovement/);
assert.doesNotMatch(inventoryBarrel, /from '@\/modules\//);

const saleBarrel = readSrc('src/core/commerce/sale/index.ts');
assert.match(saleBarrel, /from '@\/core\/sales'/);
assert.match(saleBarrel, /saleHistoryService/);
assert.match(saleBarrel, /customerPurchaseService/);
assert.match(saleBarrel, /revenueService/);
assert.doesNotMatch(saleBarrel, /pointEarnService/);

const returnBarrel = readSrc('src/core/commerce/return/index.ts');
assert.match(returnBarrel, /from '@\/core\/sales'/);
assert.match(returnBarrel, /saleReturnService/);
assert.doesNotMatch(returnBarrel, /pointReturnService/);

const paymentBarrel = readSrc('src/core/commerce/payment/index.ts');
assert.match(paymentBarrel, /SALE_PAYMENT_METHODS/);
assert.match(paymentBarrel, /from '@\/core\/sales'/);

const commerceIndex = readSrc('src/core/commerce/index.ts');
assert.match(commerceIndex, /productService/);
assert.match(commerceIndex, /inventoryService/);
assert.match(commerceIndex, /saleService/);
assert.match(commerceIndex, /saleReturnService/);
assert.match(commerceIndex, /SALE_PAYMENT_METHODS/);
assert.match(commerceIndex, /storeCapability/);
assert.doesNotMatch(commerceIndex, /from '@\/modules\//);

assert.match(
  readSrc('src/modules/retail/services/productService.ts'),
  /from '@\/core\/commerce\/product'/
);
assert.match(
  readSrc('src/modules/retail/services/inventoryService.ts'),
  /from '@\/core\/commerce\/inventory'/
);
assert.match(
  readSrc('src/modules/retail/services/saleHistoryService.ts'),
  /from '@\/core\/commerce\/sale'/
);
assert.match(
  readSrc('src/modules/retail/services/customerPurchaseService.ts'),
  /from '@\/core\/commerce\/sale'/
);
assert.match(
  readSrc('src/modules/retail/services/retailRevenueService.ts'),
  /from '@\/core\/commerce\/sale'/
);
assert.match(
  readSrc('src/modules/retail/services/retailRevenueAggregate.ts'),
  /from '@\/core\/commerce\/sale'/
);

const retailSale = readSrc('src/modules/retail/services/saleService.ts');
assert.match(retailSale, /from '@\/core\/commerce\/sale'/);
assert.match(retailSale, /pointEarnService\.earnForSale/);
assert.doesNotMatch(retailSale, /from '@\/core\/sales'/);
assert.doesNotMatch(retailSale, /pointRedeemService/);

const retailReturn = readSrc('src/modules/retail/services/saleReturnService.ts');
assert.match(retailReturn, /from '@\/core\/commerce\/return'/);
assert.match(retailReturn, /pointReturnService\.reverseForSaleReturn/);
assert.doesNotMatch(retailReturn, /from '@\/core\/sales'/);

const retailServiceAndTypeFiles = [
  'src/modules/retail/services/productService.ts',
  'src/modules/retail/services/inventoryService.ts',
  'src/modules/retail/services/saleService.ts',
  'src/modules/retail/services/saleReturnService.ts',
  'src/modules/retail/services/saleHistoryService.ts',
  'src/modules/retail/services/customerPurchaseService.ts',
  'src/modules/retail/services/retailRevenueService.ts',
  'src/modules/retail/services/retailRevenueAggregate.ts',
  'src/modules/retail/types/product.ts',
  'src/modules/retail/types/inventory.ts',
  'src/modules/retail/types/sale.ts',
  'src/modules/retail/types/saleReturn.ts',
  'src/modules/retail/types/revenue.ts',
];
for (const rel of retailServiceAndTypeFiles) {
  const src = readSrc(rel);
  assert.doesNotMatch(
    src,
    /from '@\/core\/(product|inventory|sales)(?:\/[^']*)?'/,
    `${rel} must depend on Commerce, not Core product/inventory/sales`
  );
}

assert.ok(SALE_PAYMENT_METHODS.includes('cash'));
assert.equal(formatSaleNumber('aabbccdd-1111-2222-3333-444444444444'), 'AABBCCDD');
assert.equal(buildRetailRevenueSummary, buildCommerceRevenueSummary);

console.log('commerceBarrel.test.ts: ok');
