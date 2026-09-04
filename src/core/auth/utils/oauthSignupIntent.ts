import type { AccountType } from '../types/signup';
import type { IndustryType } from '@/core/industry/types';

const OAUTH_INTENT_KEY = 'moa_oauth_signup_intent';

export type OAuthSignupIntent = {
  mode: 'login' | 'signup';
  accountType?: AccountType;
  fullName?: string;
  industryType?: IndustryType;
  businessName?: string;
  phone?: string;
  address?: string;
  businessNumber?: string;
};

/** OAuth 리다이렉트 전 가입 의도 저장 */
export function saveOAuthSignupIntent(intent: OAuthSignupIntent): void {
  try {
    sessionStorage.setItem(OAUTH_INTENT_KEY, JSON.stringify(intent));
  } catch {
    /* ignore quota / private mode */
  }
}

export function peekOAuthSignupIntent(): OAuthSignupIntent | null {
  try {
    const raw = sessionStorage.getItem(OAUTH_INTENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OAuthSignupIntent;
  } catch {
    return null;
  }
}

export function clearOAuthSignupIntent(): void {
  try {
    sessionStorage.removeItem(OAUTH_INTENT_KEY);
  } catch {
    /* ignore */
  }
}

export function consumeOAuthSignupIntent(): OAuthSignupIntent | null {
  const intent = peekOAuthSignupIntent();
  clearOAuthSignupIntent();
  return intent;
}
