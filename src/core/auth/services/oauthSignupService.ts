import { getCoreClient } from '@/lib/supabase';
import {
  consumeOAuthSignupIntent,
  type OAuthSignupIntent,
} from '../utils/oauthSignupIntent';
import type { AccountType } from '../types/signup';
import { storePendingGuardianLink } from '@/core/parent/services/guardianLinkService';
import { storePendingOrgPublicCode } from '@/core/parent/services/pendingOrgConnect';

/**
 * 카카오 OAuth 복귀 후 sessionStorage에 저장된 가입 의도를 user_metadata에 반영
 * 사업장 생성은 OrganizationSelector/CreateOrganizationWizard에서 이어감
 * pending 가디언 링크·공개코드는 sessionStorage에 재저장해 ParentShell이 redeem/요청할 수 있게 함
 */
export async function applyOAuthSignupIntentIfAny(): Promise<OAuthSignupIntent | null> {
  const intent = consumeOAuthSignupIntent();
  if (!intent) return null;

  if (intent.pendingGuardianLink) {
    storePendingGuardianLink(intent.pendingGuardianLink);
  }
  if (intent.pendingOrgPublicCode) {
    storePendingOrgPublicCode(intent.pendingOrgPublicCode);
  }

  if (intent.mode !== 'signup') return intent;

  const accountType: AccountType = intent.accountType || 'owner';
  const fullName = intent.fullName?.trim() || undefined;

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
