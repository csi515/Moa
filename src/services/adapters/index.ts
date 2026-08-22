import { getStorageBackend } from './storageContext';
import { LocalStorageAdapter } from './localStorageAdapter';
import { SupabaseAdapter } from './supabaseAdapter';
import type { IStorageAdapter } from './types';

export { STORAGE_KEYS, SUPABASE_SYNC_KEYS } from './storageKeys';
export type { StorageKey } from './storageKeys';
export {
  getStorageBackend,
  getOrganizationId,
  setOrganizationId,
  resolveStorageKey,
} from './storageContext';
export type { IStorageAdapter, StorageBackend, StorageListener } from './types';

let adapterInstance: IStorageAdapter | null = null;

/** 활성 저장소 어댑터 싱글톤 */
export function getStorageAdapter(): IStorageAdapter {
  if (!adapterInstance) {
    adapterInstance =
      getStorageBackend() === 'supabase' ? new SupabaseAdapter() : new LocalStorageAdapter();
  }
  return adapterInstance;
}

/** 테스트/재초기화용 */
export function resetStorageAdapter(): void {
  adapterInstance = null;
}
