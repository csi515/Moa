import { syncAuthProvidersOnLogin } from '../auth/services/authProviderService';
import { connectParentOnLogin } from '../parent/services/parentAccountService';
import { connectStaffOnLogin } from '../staff/services/staffAccountService';
import {
  consumePendingStaffLink,
  redeemStaffInviteLinkToken,
  setStaffLinkRedeemToast,
} from '../staff/services/staffInviteLinkService';

/** 로그인 시 계정 연결 RPC를 일관된 순서로 실행 */
export async function runLoginAccountSync(): Promise<void> {
  await connectStaffOnLogin();

  const pendingStaffLink = consumePendingStaffLink();
  if (pendingStaffLink) {
    try {
      const result = await redeemStaffInviteLinkToken(pendingStaffLink);
      setStaffLinkRedeemToast(
        `${result.organizationName} · ${result.staffName} 강사 계정 연결 완료`,
        'success'
      );
    } catch (err) {
      setStaffLinkRedeemToast(
        err instanceof Error ? err.message : '초대 링크 연결에 실패했습니다.',
        'error'
      );
    }
  }

  await syncAuthProvidersOnLogin();
  await connectParentOnLogin();
}
