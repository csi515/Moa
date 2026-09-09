import { getCoreClient } from '@/lib/supabase';

export const OWNER_BUSINESS_BLOCK_KEY = 'moa_owner_business_block';

const CACHE_PREFIX = 'moa_nts_ok:';

interface StatusResponse {
  active?: boolean;
  statusName?: string;
  message?: string;
  error?: string;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function consumeOwnerBusinessBlockMessage(): string | null {
  try {
    const message = sessionStorage.getItem(OWNER_BUSINESS_BLOCK_KEY);
    if (message) sessionStorage.removeItem(OWNER_BUSINESS_BLOCK_KEY);
    return message;
  } catch {
    return null;
  }
}

export function rememberOwnerBusinessBlock(message: string): void {
  try {
    sessionStorage.setItem(OWNER_BUSINESS_BLOCK_KEY, message);
  } catch {
    /* ignore */
  }
}

function readBusinessNumber(row: Record<string, unknown>): string {
  const column = String(row.business_registration_number ?? '');
  if (digitsOnly(column).length === 10) return column;
  const settings = row.settings;
  if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
    const fromSettings = String((settings as { businessNumber?: string }).businessNumber ?? '');
    if (digitsOnly(fromSettings).length === 10) return fromSettings;
  }
  return '';
}

/** 국세청 상태조회 — 계속사업자(01)만 통과 */
export async function assertContinuingBusiness(businessNumber: string): Promise<void> {
  const digits = digitsOnly(businessNumber);
  if (digits.length !== 10 || /^0+$/.test(digits)) {
    throw new Error('사업자등록번호를 입력해 주세요. 계속사업자만 로그인할 수 있습니다.');
  }

  const cacheKey = `${CACHE_PREFIX}${digits}:${todayKey()}`;
  try {
    if (sessionStorage.getItem(cacheKey) === '01') return;
  } catch {
    /* ignore */
  }

  const { data, error } = await getCoreClient().functions.invoke<StatusResponse>(
    'verify-business-status',
    { body: { businessNumber: digits } }
  );

  if (error) {
    throw new Error('사업자 상태를 확인하지 못했습니다. 잠시 후 다시 로그인해 주세요.');
  }
  if (!data?.active) {
    throw new Error(data?.message || data?.error || '계속사업자가 아니면 로그인할 수 없습니다.');
  }

  try {
    sessionStorage.setItem(cacheKey, '01');
  } catch {
    /* ignore */
  }
}

export async function loadOwnerBusinessNumber(organizationId: string): Promise<string> {
  const { data, error } = await getCoreClient()
    .from('organizations')
    .select('business_registration_number, settings')
    .eq('id', organizationId)
    .maybeSingle();

  if (error || !data) return '';
  return readBusinessNumber(data as Record<string, unknown>);
}

export async function assertOwnerOrganizationsActive(organizationIds: string[]): Promise<void> {
  const unique = [...new Set(organizationIds.filter(Boolean))];
  if (unique.length === 0) return;

  for (const organizationId of unique) {
    const businessNumber = await loadOwnerBusinessNumber(organizationId);
    await assertContinuingBusiness(businessNumber);
  }
}
