import { Session, User } from '@supabase/supabase-js';
import { getCoreClient } from '../../../lib/supabase';

import type { SignUpBusinessDetails } from '../types/signup';

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  business?: SignUpBusinessDetails;
}

export interface SignInParams {
  email: string;
  password: string;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await getCoreClient().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signUp({ email, password, fullName, business }: SignUpParams): Promise<{
  user: User;
  session: Session | null;
}> {
  const { data, error } = await getCoreClient().auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        ...(business
          ? {
              signup_industry_type: business.industryType,
              signup_business_name: business.businessName,
              signup_phone: business.phone,
              signup_address: business.address,
              signup_business_number: business.businessNumber ?? '',
            }
          : {}),
      },
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

/** 비밀번호 재설정 이메일 발송 */
export async function resetPassword(email: string): Promise<void> {
  const baseUrl =
    (import.meta.env.VITE_APP_URL as string | undefined)?.trim() || window.location.origin;
  const redirectTo = baseUrl.replace(/\/$/, '/');
  const { error } = await getCoreClient().auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });
  if (error) throw error;
}

export function onAuthStateChange(
  callback: (session: Session | null) => void
): () => void {
  const {
    data: { subscription },
  } = getCoreClient().auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
}
