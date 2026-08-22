import type { StorageApi } from './helpers';
import { createTextbookCatalogStorage } from './textbookCatalogStorage';
import { createTextbookSalesStorage } from './textbookSalesStorage';

/** 교재·판매·재고·통합 청구 도메인 (catalog + sales) */
export function createTextbookStorage(api: StorageApi) {
  return Object.assign(createTextbookCatalogStorage(api), createTextbookSalesStorage(api));
}
