import React, { useEffect } from 'react';
import { useOptionalAuth } from './core/auth/AuthProvider';
import { useOptionalOrganization } from './core/organizations/OrganizationProvider';
import { mapMemberRoleToAppRole } from './core/organizations/services/organizationService';
import { StorageService } from './services/storage';

/** Supabase Organization 역할을 기존 AppContext 권한(director/teacher)과 동기화 */
export const SupabaseRoleSync: React.FC = () => {
  const auth = useOptionalAuth();
  const org = useOptionalOrganization();

  useEffect(() => {
    if (!auth?.user || !org?.currentRole) return;

    const fullName =
      (auth.user.user_metadata?.full_name as string | undefined) ||
      auth.user.email?.split('@')[0] ||
      '사용자';

    StorageService.setActiveUser({
      id: auth.user.id,
      name: fullName,
      role: mapMemberRoleToAppRole(org.currentRole),
      email: auth.user.email || '',
    });
  }, [auth?.user, org?.currentRole, org?.currentOrganization?.id]);

  return null;
};
