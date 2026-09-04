import { getCoreClient } from '@/lib/supabase';
import {
  consumeOAuthSignupIntent,
  type OAuthSignupIntent,
} from '../utils/oauthSignupIntent';
import type { AccountType } from '../types/signup';

/**
 * 카카오 OAuth 복귀 후 sessionStorage에 저장된 가입 의도를 user_metadata에 반영
 * 사업장 생성은 OrganizationSelector/CreateOrganizationWizard에서 이어감
 */
export async function applyOAuthSignupIntentIfAny(): Promise<OAuthSignupIntent | null> {
  const intent = consumeOAuthSignupIntent();
  if (!intent || intent.mode !== 'signup') return intent;

  const accountType: AccountType = intent.accountType || 'owner';
  const fullName =
    intent.fullName?.trim() ||
    undefined;

  const { error } = await getCoreClient().auth.updateUser({
    data: {
      ...(fullName ? { full_name: fullName } : {}),
      account_type: accountType,
      ...(accountType === 'owner' && intent.businessName
        ? {
            signup_industry_type: intent.industryType || 'piano',
            signup_business_name: intent.businessName,
            signup_phone: intent.phone || '',
            signup_address: intent.address || '',
            signup_business_number: intent.businessNumber || '',
          }
        : {}),
    },
  });

  if (error) {
    console.warn('[oauth] failed to apply signup intent', error.message);
  }

  return intent;
}
