import { getCoreClient } from '../../../lib/supabase';

export type UpdatePublicCodeResult =
  | { success: true; publicCode: string }
  | { error: string };

interface UpdatePublicCodeRpcRow {
  error?: string;
  success?: boolean;
  publicCode?: string;
}

/** 업체 공개 코드 변경 (DB 유일성 검증) */
export async function updateOrganizationPublicCode(
  organizationId: string,
  publicCode: string
): Promise<UpdatePublicCodeResult> {
  const { data, error } = await getCoreClient().rpc(
    'update_organization_public_code' as never,
    {
      p_organization_id: organizationId,
      p_public_code: publicCode,
    } as never
  );

  if (error) {
    console.error('update_organization_public_code failed:', error);
    return { error: 'request_failed' };
  }

  const row = data as UpdatePublicCodeRpcRow | null;
  if (!row?.success || !row.publicCode) {
    return { error: row?.error ?? 'request_failed' };
  }

  return { success: true, publicCode: row.publicCode };
}
