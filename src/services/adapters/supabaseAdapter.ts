import { readLocal, removeLocal, writeLocal } from './localStorageEngine';
import { getOrganizationId, setOrganizationId } from './storageContext';
import { STORAGE_KEYS, SUPABASE_SYNC_KEYS, type StorageKey } from './storageKeys';
import { hydrateCoreEntities, persistCoreEntity } from './sync/coreEntitySync';
import type { IStorageAdapter, StorageListener } from './types';

/** Supabase 하이브리드 어댑터 — Core 엔티티는 Supabase, Piano 모듈은 org-scoped localStorage */
export class SupabaseAdapter implements IStorageAdapter {
  readonly backend = 'supabase' as const;

  private listeners = new Set<StorageListener>();
  private cache = new Map<string, unknown>();
  private hydrated = false;
  private hydrating = false;
  private persistTimers = new Map<string, ReturnType<typeof setTimeout>>();

  getItem<T>(key: StorageKey, defaultValue: T): T {
    if (SUPABASE_SYNC_KEYS.has(key) && this.cache.has(key)) {
      return this.cache.get(key) as T;
    }
    return readLocal(key, defaultValue);
  }

  setItem<T>(key: StorageKey, value: T): void {
    if (SUPABASE_SYNC_KEYS.has(key)) {
      this.cache.set(key, value);
      this.schedulePersist(key);
    } else {
      writeLocal(key, value);
    }
    this.notify();
  }

  removeItem(key: StorageKey): void {
    if (SUPABASE_SYNC_KEYS.has(key)) {
      this.cache.delete(key);
      this.schedulePersist(key);
    } else {
      removeLocal(key);
    }
    this.notify();
  }

  subscribe(listener: StorageListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async hydrate(organizationId: string): Promise<void> {
    if (this.hydrating) return;

    setOrganizationId(organizationId);
    this.hydrating = true;
    this.hydrated = false;

    try {
      await hydrateCoreEntities(organizationId, {
        get: <T>(key: StorageKey) => this.cache.get(key) as T | undefined,
        set: <T>(key: StorageKey, value: T) => this.cache.set(key, value),
        delete: (key: StorageKey) => this.cache.delete(key),
      });
      this.hydrated = true;
      this.notify();
    } finally {
      this.hydrating = false;
    }
  }

  clearOrganization(): void {
    this.cache.clear();
    this.hydrated = false;
    this.persistTimers.forEach((timer) => clearTimeout(timer));
    this.persistTimers.clear();
    setOrganizationId(null);
  }

  isHydrated(): boolean {
    return this.hydrated;
  }

  isHydrating(): boolean {
    return this.hydrating;
  }

  private schedulePersist(key: StorageKey): void {
    const existing = this.persistTimers.get(key);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.persistTimers.delete(key);
      void this.persistKey(key);
    }, 300);

    this.persistTimers.set(key, timer);
  }

  private async persistKey(key: StorageKey): Promise<void> {
    const orgId = getOrganizationId();
    if (!orgId || !SUPABASE_SYNC_KEYS.has(key)) return;

    await persistCoreEntity(key, orgId, {
      get: <T>(k: StorageKey) => this.cache.get(k) as T | undefined,
      set: <T>(k: StorageKey, value: T) => this.cache.set(k, value),
      delete: (k: StorageKey) => this.cache.delete(k),
    });
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
