import type { AcademySettings, Teacher } from '../../types';
import type { StorageKey } from './storageKeys';

export type StorageListener = () => void;

/** 저장소 어댑터 인터페이스 — sync API 유지, hydrate만 async */
export interface IStorageAdapter {
  readonly backend: 'supabase';

  getItem<T>(key: StorageKey, defaultValue: T): T;
  setItem<T>(key: StorageKey, value: T): void;
  removeItem(key: StorageKey): void;

  subscribe(listener: StorageListener): () => void;

  /** Supabase 모드: org 선택 시 원격 데이터 로드 */
  hydrate(organizationId: string): Promise<void>;

  /** org 전환/로그아웃 시 캐시 초기화 */
  clearOrganization(): void;

  isHydrated(): boolean;
  isHydrating(): boolean;
}

/** Supabase staff ↔ Teacher 매핑용 metadata */
export interface StaffMetadata {
  hireDate?: string;
  specialty?: string;
  salary?: number;
  color?: string;
  memo?: string;
  classIds?: string[];
}

/** organizations.settings JSONB에 저장되는 학원 설정 */
export type OrganizationSettingsPayload = AcademySettings;

export type { Teacher };
