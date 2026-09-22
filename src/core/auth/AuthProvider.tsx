import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { StorageService } from '../../services/storage';
import * as authService from './services/authService';
import { clearLocalPushTokensForUser, resetAppPushRegistrationContext } from '@/core/push';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithKakao: () => Promise<void>;
  signInWithNaver: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getSession()
      .then(setSession)
      .finally(() => setLoading(false));

    return authService.onAuthStateChange(setSession);
  }, []);

  const signIn = async (email: string, password: string) => {
    const newSession = await authService.signIn({ email, password });
    setSession(newSession);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { session: newSession } = await authService.signUp({
      email,
      password,
      fullName,
    });
    if (newSession) {
      setSession(newSession);
      return;
    }
    const nextSession = await authService.signIn({ email, password });
    setSession(nextSession);
  };

  const signInWithKakao = async () => {
    await authService.signInWithKakao();
  };

  const signInWithNaver = async () => {
    await authService.signInWithNaver();
  };

  const signOut = async () => {
    const userId = session?.user?.id;
    StorageService.clearOrganization();
    if (userId) clearLocalPushTokensForUser(userId);
    resetAppPushRegistrationContext();
    await authService.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signIn,
        signUp,
        signInWithKakao,
        signInWithNaver,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/** AuthProvider 외부에서도 안전하게 사용 (localStorage 모드) */
export function useOptionalAuth(): AuthContextType | null {
  return useContext(AuthContext) ?? null;
}
