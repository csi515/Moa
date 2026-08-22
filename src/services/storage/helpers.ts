import { getStorageAdapter, type StorageKey } from '../adapters';
import type { AcademySettings } from '../../types';

export const DEFAULT_SETTINGS: AcademySettings = {
  name: '',
  address: '',
  phone: '',
  directorName: '',
  defaultTuitionFee: 180000,
  defaultPaymentDay: 25,
};

export function getItem<T>(key: StorageKey, defaultValue: T): T {
  return getStorageAdapter().getItem(key, defaultValue);
}

export function setItem<T>(key: StorageKey, value: T): void {
  getStorageAdapter().setItem(key, value);
}

export function generateEntityId(_prefix: string): string {
  return crypto.randomUUID();
}

/** 순환 참조 없이 도메인 모듈이 StorageService API를 참조 */
export type StorageApi = Record<string, (...args: unknown[]) => unknown>;
