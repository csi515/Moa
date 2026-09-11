import { getCoreClient } from '@/lib/supabase';

export interface ParentInviteLinkCode {
  token: string;
  studentName: string;
  customerId: string;
  expiresAt: string;
}

function parseLinkCodes(raw: unknown): ParentInviteLinkCode[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      token: String(row.token ?? ''),
      studentName: String(row.student_name ?? row.studentName ?? ''),
      customerId: String(row.customer_id ?? row.customerId ?? ''),
      expiresAt: String(row.expires_at ?? row.expiresAt ?? ''),
    };
  });
}

export function parseInviteLinkCodesFromResult(data: unknown): ParentInviteLinkCode[] {
  const root = (data ?? {}) as Record<string, unknown>;
  return parseLinkCodes(root.link_codes ?? root.linkCodes);
}

/** 앱 공개 URL (QR·초대 링크). 브라우저에서는 현재 origin을 우선해 배포 호스트와 맞춤 */
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') || '';
}

export function buildParentInviteUrl(token: string): string {
  return `${getAppBaseUrl()}/?link=${encodeURIComponent(token)}`;
}

export async function sendParentInvitationEmail(params: {
  organizationName: string;
  parentName: string;
  email: string;
  linkCodes: ParentInviteLinkCode[];
}): Promise<{ emailSent: boolean; message?: string }> {
  const { data, error } = await getCoreClient().functions.invoke('send-parent-invitation', {
    body: {
      organizationName: params.organizationName,
      parentName: params.parentName,
      email: params.email,
      linkCodes: params.linkCodes.map((c) => ({
        token: c.token,
        student_name: c.studentName,
        customer_id: c.customerId,
        expires_at: c.expiresAt,
      })),
      appUrl: getAppBaseUrl() || undefined,
    },
  });

  if (error) {
    return { emailSent: false, message: error.message };
  }

  const result = (data ?? {}) as { email_sent?: boolean; message?: string };
  return {
    emailSent: Boolean(result.email_sent),
    message: result.message,
  };
}
