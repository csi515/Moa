import { createTextbookStorage } from '@/services/storage/textbookStorage';
import type { StorageApi } from '@/services/storage/helpers';

/** Commerce persistence facade. 기존 textbook/catalog factory를 연결한다. */
export function createCommerceCapabilityStorage(api: StorageApi) {
  return createTextbookStorage(api);
}

export type CommerceCapabilityStorage = ReturnType<typeof createCommerceCapabilityStorage>;
