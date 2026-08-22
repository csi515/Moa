import React, { useEffect } from 'react';
import { useOptionalAuth } from './core/auth/AuthProvider';
import { StorageService } from './services/storage';

/** Supabase 로그인 사용자 → 사장(owner) activeUser 동기화 */
export const SupabaseRoleSync: React.FC = () => {
  const auth = useOptionalAuth();

  useEffect(() => {
    if (!auth?.user) return;

    const fullName =
      (auth.user.user_metadata?.full_name as string | undefined) ||
      auth.user.email?.split('@')[0] ||
      '원장님';

    StorageService.setActiveUser({
      id: auth.user.id,
      name: fullName,
      role: 'owner',
      email: auth.user.email || '',
    });
  }, [auth?.user]);

  return null;
};
