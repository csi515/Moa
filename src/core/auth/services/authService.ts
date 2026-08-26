import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { getCoreClient } from '../../../lib/supabase';

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

/** Supabase 인증 오류를 사용자용 한국어 메시지로 변환 */
export function toAuthErrorMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const lower = raw.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }
  if (lower.includes('email not confirmed')) {
    return '이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.';
  }
  if (lower.includes('user already registered')) {
    return '이미 가입된 이메일입니다. 로그인해 주세요.';
  }
  if (lower.includes('password should be at least') || lower.includes('password is known')) {
    return '비밀번호는 6자 이상이어야 합니다.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (lower.includes('for security purposes') || lower.includes('only request this after')) {
    return '보안을 위해 잠시 후 다시 요청해 주세요.';
  }
  if (lower.includes('unable to validate email') || lower.includes('invalid email')) {
    return '올바른 이메일 주소를 입력해 주세요.';
  }
  if (raw.trim()) return raw;
  return fallback;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await getCoreClient().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signUp({ email, password, fullName }: SignUpParams): Promise<{
  user: User;
  session: Session | null;
}> {
  const { data, error } = await getCoreClient().auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('회원가입에 실패했습니다.');
  return { user: data.user, session: data.session };
}

export async function signIn({ email, password }: SignInParams): Promise<Session> {
  const { data, error } = await getCoreClient().auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.session) throw new Error('로그인에 실패했습니다.');
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await getCoreClient().auth.signOut();
  if (error) throw error;
}

/** 비밀번호 재설정 메일 발송 (Supabase Auth) */
export async function resetPasswordForEmail(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}${window.location.pathname || '/'}`;
  const { error } = await getCoreClient().auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw error;
}

/** 로그인(복구) 세션에서 새 비밀번호 설정 */
export async function updatePassword(password: string): Promise<User> {
  const { data, error } = await getCoreClient().auth.updateUser({ password });
  if (error) throw error;
  if (!data.user) throw new Error('비밀번호 변경에 실패했습니다.');
  return data.user;
}

/** URL 해시/쿼리에 비밀번호 복구 토큰이 있는지 */
export function hasPasswordRecoveryInUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  return (
    hash.includes('type=recovery') ||
    search.includes('type=recovery') ||
    hash.includes('type%3Drecovery')
  );
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): () => void {
  const {
    data: { subscription },
  } = getCoreClient().auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return () => subscription.unsubscribe();
}
