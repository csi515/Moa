import { getCoreClient } from '@/lib/supabase';
import type { Json } from '@/lib/supabase/database.types';

export type AuthProviderType = 'email' | 'phone' | 'kakao' | 'naver' | 'google' | 'apple';

export interface AuthProviderRecord {
  id: string;
  provider: AuthProviderType;
  providerUserId: string;
  email: string | null;
  phone: string | null;
  verifiedAt: string | null;
}

export interface SyncAuthProvidersResult {
  synced: number;
}

/** 로그인 시 email identity를 auth_providers에 동기화 */
export async function syncAuthProvidersOnLogin(): Promise<SyncAuthProvidersResult> {
  const { data, error } = await getCoreClient().rpc('sync_auth_providers_on_login');
  if (error) throw error;

  const result = (data ?? {}) as { synced?: number };
  return { synced: result.synced ?? 0 };
}

/**
 * OAuth provider 등록 RPC — 카카오 로그인 후 sync_auth_providers_on_login과 병행 가능
 */
export async function registerAuthProvider(params: {
  provider: AuthProviderType;
  providerUserId: string;
  email?: string | null;
  phone?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<AuthProviderRecord> {
  const { data, error } = await getCoreClient().rpc('register_auth_provider', {
    p_provider: params.provider,
    p_provider_user_id: params.providerUserId,
    p_email: params.email ?? null,
    p_phone: params.phone ?? null,
    p_metadata: (params.metadata ?? {}) as Json,
  });
  if (error) throw error;

  const row = (data ?? {}) as {
    id: string;
    provider: AuthProviderType;
    provider_user_id: string;
  };

  return {
    id: String(row.id),
    provider: row.provider,
    providerUserId: String(row.provider_user_id),
    email: params.email ?? null,
    phone: params.phone ?? null,
    verifiedAt: new Date().toISOString(),
  };
}
