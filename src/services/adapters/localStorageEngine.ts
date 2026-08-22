import { resolveStorageKey } from './storageContext';
import type { StorageKey } from './storageKeys';

export function readLocal<T>(key: StorageKey, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(resolveStorageKey(key));
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to parse storage item ${key}:`, e);
    return defaultValue;
  }
}

export function writeLocal<T>(key: StorageKey, value: T): void {
  try {
    localStorage.setItem(resolveStorageKey(key), JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to set storage item ${key}:`, e);
  }
}

export function removeLocal(key: StorageKey): void {
  try {
    localStorage.removeItem(resolveStorageKey(key));
  } catch (e) {
    console.error(`Failed to remove storage item ${key}:`, e);
  }
}

export function readLocalRaw(resolvedKey: string): string | null {
  try {
    return localStorage.getItem(resolvedKey);
  } catch {
    return null;
  }
}

export function writeLocalRaw(resolvedKey: string, value: string): void {
  try {
    localStorage.setItem(resolvedKey, value);
  } catch (e) {
    console.error(`Failed to set raw storage item ${resolvedKey}:`, e);
  }
}
