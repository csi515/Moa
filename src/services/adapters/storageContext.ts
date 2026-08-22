import { isSupabaseConfigured } from '../../lib/supabase';
import type { StorageBackend } from './types';

let organizationId: string | null = null;

/** 환경 변수 기반 저장소 백엔드 결정 */
export function getStorageBackend(): StorageBackend {
  const envBackend = import.meta.env.VITE_STORAGE_BACKEND as string | undefined;
  if (envBackend === 'supabase' && isSupabaseConfigured()) {
    return 'supabase';
  }
  return 'local';
}

export function getOrganizationId(): string | null {
  return organizationId;
}

export function setOrganizationId(id: string | null): void {
  organizationId = id;
}

/** Supabase 모드에서 org 스코프 키 생성 */
export function resolveStorageKey(baseKey: string): string {
  if (getStorageBackend() === 'supabase' && organizationId) {
    return `${baseKey}_${organizationId}`;
  }
  return baseKey;
}
