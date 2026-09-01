import { getCoreClient } from '../../../lib/supabase';

export interface StaffInviteLinkCode {
  token: string;
  staffName: string;
  staffId: string;
  organizationId: string;
  organizationName: string;
  expiresAt: string;
}

export interface RedeemStaffLinkResult {
  success: boolean;
  staffId: string;
  staffName: string;
  organizationId: string;
  organizationName: string;
}

const PENDING_STAFF_LINK_KEY = 'moa_pending_staff_link';

export function getAppBaseUrl(): string {
  return (
    (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  );
}

export function buildStaffInviteUrl(token: string): string {
  return `${getAppBaseUrl()}/?staff_link=${encodeURIComponent(token)}`;
}

export function parseStaffLinkCodeFromResult(data: unknown): StaffInviteLinkCode | null {
  const root = (data ?? {}) as Record<string, unknown>;
  const raw = root.link_code ?? root.linkCode;
  if (!raw || typeof raw !== 'object') return null;

  const row = raw as Record<string, unknown>;
  const token = String(row.token ?? '');
  if (!token) return null;

  return {
    token,
    staffId: String(row.staff_id ?? row.staffId ?? ''),
    staffName: String(row.staff_name ?? row.staffName ?? ''),
    organizationId: String(row.organization_id ?? row.organizationId ?? ''),
    organizationName: String(row.organization_name ?? row.organizationName ?? ''),
    expiresAt: String(row.expires_at ?? row.expiresAt ?? ''),
  };
}

export async function createStaffInviteLinkToken(
  organizationId: string,
  staffId: string,
  expiresDays = 14
): Promise<StaffInviteLinkCode> {
  const { data, error } = await getCoreClient().rpc('create_staff_invite_link_token', {
    p_org_id: organizationId,
    p_staff_id: staffId,
    p_expires_days: expiresDays,
  });
  if (error) throw error;

  const code = parseStaffLinkCodeFromResult({ link_code: data });
  if (!code) throw new Error('초대 링크 생성에 실패했습니다.');
  return code;
}

export async function redeemStaffInviteLinkToken(token: string): Promise<RedeemStaffLinkResult> {
  const { data, error } = await getCoreClient().rpc('redeem_staff_invite_link_token', {
    p_token: token.trim(),
  });
  if (error) throw error;

  const raw = data as Record<string, unknown>;
  return {
    success: Boolean(raw.success),
    staffId: String(raw.staff_id ?? ''),
    staffName: String(raw.staff_name ?? ''),
    organizationId: String(raw.organization_id ?? ''),
    organizationName: String(raw.organization_name ?? ''),
  };
}

export async function revokeStaffInviteLinkToken(
  organizationId: string,
  tokenId: string
): Promise<void> {
  const { error } = await getCoreClient().rpc('revoke_staff_invite_link_token', {
    p_org_id: organizationId,
    p_token_id: tokenId,
  });
  if (error) throw error;
}

export function storePendingStaffLink(token: string): void {
  sessionStorage.setItem(PENDING_STAFF_LINK_KEY, token.trim().toUpperCase());
}

export function consumePendingStaffLink(): string | null {
  const token = sessionStorage.getItem(PENDING_STAFF_LINK_KEY);
  if (token) sessionStorage.removeItem(PENDING_STAFF_LINK_KEY);
  return token;
}

export function parseStaffLinkFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const link = params.get('staff_link')?.trim().toUpperCase();
  if (link) {
    const url = new URL(window.location.href);
    url.searchParams.delete('staff_link');
    window.history.replaceState({}, '', url.pathname + url.search);
  }
  return link || null;
}

let pendingRedeemToast: { message: string; type: 'success' | 'error' } | null = null;

export function setStaffLinkRedeemToast(message: string, type: 'success' | 'error' = 'success'): void {
  pendingRedeemToast = { message, type };
}

export function consumeStaffLinkRedeemToast(): { message: string; type: 'success' | 'error' } | null {
  const toast = pendingRedeemToast;
  pendingRedeemToast = null;
  return toast;
}

export type ShareInviteLinkResult = 'shared' | 'copied' | 'cancelled';

/** 모바일 SNS 공유 시트 또는 클립보드 복사 */
export async function shareInviteLink(params: {
  title: string;
  text: string;
  url: string;
}): Promise<ShareInviteLinkResult> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: params.title,
        text: params.text,
        url: params.url,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  await navigator.clipboard.writeText(`${params.text}\n${params.url}`);
  return 'copied';
}
