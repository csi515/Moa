import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as authService from './services/authService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** 메일 링크로 들어온 비밀번호 재설정 세션 */
  passwordRecoveryPending: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecoveryPending, setPasswordRecoveryPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    authService
      .getSession()
      .then((s) => {
        if (cancelled) return;
        setSession(s);
        if (s && authService.hasPasswordRecoveryInUrl()) {
          setPasswordRecoveryPending(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsubscribe = authService.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryPending(true);
      }
      if (event === 'SIGNED_OUT') {
        setPasswordRecoveryPending(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const newSession = await authService.signIn({ email, password });
      setSession(newSession);
      setPasswordRecoveryPending(false);
    } catch (err) {
      throw new Error(authService.toAuthErrorMessage(err, '로그인에 실패했습니다.'));
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { session: newSession } = await authService.signUp({ email, password, fullName });
      if (newSession) {
        setSession(newSession);
        return;
      }
      const signedIn = await authService.signIn({ email, password });
      setSession(signedIn);
    } catch (err) {
      throw new Error(authService.toAuthErrorMessage(err, '회원가입에 실패했습니다.'));
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setSession(null);
    setPasswordRecoveryPending(false);
  };

  const requestPasswordReset = async (email: string) => {
    try {
      await authService.resetPasswordForEmail(email);
    } catch (err) {
      throw new Error(
        authService.toAuthErrorMessage(err, '비밀번호 재설정 메일 발송에 실패했습니다.')
      );
    }
  };

  const updatePassword = async (password: string) => {
    try {
      await authService.updatePassword(password);
      setPasswordRecoveryPending(false);
      // 복구 URL 해시 정리 (새로고침 시 재진입 방지)
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch (err) {
      throw new Error(authService.toAuthErrorMessage(err, '비밀번호 변경에 실패했습니다.'));
    }
  };

  const clearPasswordRecovery = () => {
    setPasswordRecoveryPending(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        passwordRecoveryPending,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        updatePassword,
        clearPasswordRecovery,
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
