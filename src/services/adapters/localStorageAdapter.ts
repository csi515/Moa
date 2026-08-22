import { readLocal, removeLocal, writeLocal } from './localStorageEngine';
import { STORAGE_KEYS } from './storageKeys';
import type { IStorageAdapter, StorageListener } from './types';

/** localStorage 전용 어댑터 */
export class LocalStorageAdapter implements IStorageAdapter {
  readonly backend = 'local' as const;

  private listeners = new Set<StorageListener>();

  getItem<T>(key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS], defaultValue: T): T {
    return readLocal(key, defaultValue);
  }

  setItem<T>(key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS], value: T): void {
    writeLocal(key, value);
    this.notify();
  }

  removeItem(key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]): void {
    removeLocal(key);
    this.notify();
  }

  subscribe(listener: StorageListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async hydrate(_organizationId: string): Promise<void> {
    // local 모드: hydrate 불필요
  }

  clearOrganization(): void {
    // local 모드: no-op
  }

  isHydrated(): boolean {
    return true;
  }

  isHydrating(): boolean {
    return false;
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Storage listener error:', e);
      }
    });
  }
}
