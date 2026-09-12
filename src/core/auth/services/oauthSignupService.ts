import { getCoreClient } from '@/lib/supabase';
import {
  consumeOAuthSignupIntent,
  type OAuthSignupIntent,
} from '../utils/oauthSignupIntent';
import { storePendingGuardianLink } from '@/core/parent/services/guardianLinkService';
import { storePendingOrgPublicCode } from '@/core/parent/services/pendingOrgConnect';
import { setParentPortalModeActive } from '@/core/parent/services/appModeService';

/**
 * 카카오 OAuth 복귀 후 sessionStorage에 저장된 가입 의도를 프로필에 반영
 * 역할·사업장은 OrganizationMembership(개설·초대·연결)에서 결정
 * pending 가디언 링크·공개코드는 sessionStorage에 재저장해 ParentShell이 redeem/요청할 수 있게 함
 */
export async function applyOAuthSignupIntentIfAny(): Promise<OAuthSignupIntent | null> {
  const intent = consumeOAuthSignupIntent();
  if (!intent) return null;

  if (intent.pendingGuardianLink) {
    storePendingGuardianLink(intent.pendingGuardianLink);
    setParentPortalModeActive(true);
  }
  if (intent.pendingOrgPublicCode) {
    storePendingOrgPublicCode(intent.pendingOrgPublicCode);
    setParentPortalModeActive(true);
  }

  if (intent.mode !== 'signup') return intent;

  const fullName = intent.fullName?.trim() || undefined;
  if (fullName) {
    const { error } = await getCoreClient().auth.updateUser({
      data: { full_name: fullName },
    });
    if (error) {
      console.warn('[oauth] failed to apply signup intent', error.message);
    }
  }

  return intent;
}
