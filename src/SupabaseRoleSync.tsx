import React, { useEffect } from 'react';
import { useOptionalAuth } from './core/auth/AuthProvider';
import { useOptionalOrganization } from './core/organizations/OrganizationProvider';
import { StorageService } from './services/storage';
import type { UserRole } from './types';

/** Supabase 로그인 사용자 → 조직 역할·staffId 기반 activeUser 동기화 */
export const SupabaseRoleSync: React.FC = () => {
  const auth = useOptionalAuth();
  const org = useOptionalOrganization();

  useEffect(() => {
    if (!auth?.user) return;

    const fullName =
      (auth.user.user_metadata?.full_name as string | undefined) ||
      auth.user.email?.split('@')[0] ||
      '사용자';

    // membership 없는 부모 전용 세션에서 owner 폴백 금지
    const role: UserRole = org?.currentRole ?? 'parent';
    const staffId = org?.currentStaffId ?? null;
    const parentCustomerId = org?.currentParentCustomerId ?? null;

    StorageService.setActiveUser({
      id: auth.user.id,
      name: fullName,
      role,
      staffId,
      parentCustomerId,
      email: auth.user.email || '',
    });
  }, [auth?.user, org?.currentRole, org?.currentStaffId, org?.currentParentCustomerId]);

  return null;
};
