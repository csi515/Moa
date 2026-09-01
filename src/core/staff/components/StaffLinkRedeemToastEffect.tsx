import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { consumeStaffLinkRedeemToast } from '@/core/staff/services/staffInviteLinkService';

/** 로그인 후 강사 초대 링크 자동 연결 결과 토스트 */
export function StaffLinkRedeemToastEffect() {
  const { showToast } = useApp();

  useEffect(() => {
    const toast = consumeStaffLinkRedeemToast();
    if (toast) {
      showToast(toast.message, toast.type);
    }
  }, [showToast]);

  return null;
}
