import { getCoreClient } from '@/lib/supabase';

export interface GuardianLinkTokenResult {
  id: string;
  token: string;
  expiresAt: string;
  studentName: string;
  organizationId: string;
}

export interface GuardianLinkTokenItem {
  id: string;
  tokenType: string;
  expiresAt: string | null;
  maxUses: number;
  usedCount: number;
  createdAt: string;
  studentName: string | null;
  metadata?: Record<string, unknown>;
}

export interface RedeemLinkResult {
  success: boolean;
  studentName: string;
  organizationName: string;
  organizationId: string;
}

export async function createGuardianLinkToken(
  organizationId: string,
  customerId: string,
  expiresDays = 7,
  maxUses = 1
): Promise<GuardianLinkTokenResult> {
  const { data, error } = await getCoreClient().rpc('create_guardian_link_token', {
    p_org_id: organizationId,
    p_customer_id: customerId,
    p_expires_days: expiresDays,
    p_max_uses: maxUses,
  });
  if (error) throw error;

  const raw = data as Record<string, unknown>;
  return {
    id: String(raw.id),
    token: String(raw.token),
    expiresAt: String(raw.expires_at),
    studentName: String(raw.student_name ?? ''),
    organizationId: String(raw.organization_id),
  };
}

export async function listGuardianLinkTokens(
  organizationId: string
): Promise<GuardianLinkTokenItem[]> {
  const { data, error } = await getCoreClient().rpc('list_guardian_link_tokens', {
    p_org_id: organizationId,
  });
  if (error) throw error;

  const rows = (data as Record<string, unknown>[] | null) ?? [];
  return rows.map((r) => ({
    id: String(r.id),
    tokenType: String(r.token_type ?? 'invite_code'),
    expiresAt: r.expires_at ? String(r.expires_at) : null,
    maxUses: Number(r.max_uses ?? 1),
    usedCount: Number(r.used_count ?? 0),
    createdAt: String(r.created_at ?? ''),
    studentName: r.student_name ? String(r.student_name) : null,
    metadata: r.metadata as Record<string, unknown> | undefined,
  }));
}

export async function revokeGuardianLinkToken(
  organizationId: string,
  tokenId: string
): Promise<void> {
  const { error } = await getCoreClient().rpc('revoke_guardian_link_token', {
    p_org_id: organizationId,
    p_token_id: tokenId,
  });
  if (error) throw error;
}

export async function redeemGuardianLinkToken(token: string): Promise<RedeemLinkResult> {
  const { data, error } = await getCoreClient().rpc('redeem_guardian_link_token', {
    p_token: token.trim(),
  });
  if (error) throw error;

  const raw = data as Record<string, unknown>;
  return {
    success: Boolean(raw.success),
    studentName: String(raw.student_name ?? ''),
    organizationName: String(raw.organization_name ?? ''),
    organizationId: String(raw.organization_id ?? ''),
  };
}

/** URL ?link=CODE 또는 sessionStorage pending token */
const PENDING_LINK_KEY = 'moa_pending_guardian_link';

export function storePendingGuardianLink(token: string): void {
  sessionStorage.setItem(PENDING_LINK_KEY, token.trim().toUpperCase());
}

export function consumePendingGuardianLink(): string | null {
  const token = sessionStorage.getItem(PENDING_LINK_KEY);
  if (token) sessionStorage.removeItem(PENDING_LINK_KEY);
  return token;
}

export function parseGuardianLinkFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const link = params.get('link')?.trim().toUpperCase();
  if (link) {
    const url = new URL(window.location.href);
    url.searchParams.delete('link');
    window.history.replaceState({}, '', url.pathname + url.search);
  }
  return link || null;
}
