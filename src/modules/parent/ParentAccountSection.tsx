import type { FC } from 'react';
import { AccountDeletionCard } from '@/core/account';
import { LegalLinks } from '@/core/legal';

const PARENT_ACCOUNT_DESCRIPTION =
  '학부모 계정을 삭제하면 로그인 정보와 포털 연결이 제거됩니다. 학원에 등록된 원생 정보는 학원 데이터로 남을 수 있습니다.';

/** 학부모 포털 공통 계정·법적 고지 영역 */
export const ParentAccountSection: FC = () => (
  <div className="space-y-4 pt-6 border-t border-slate-200">
    <AccountDeletionCard description={PARENT_ACCOUNT_DESCRIPTION} />
    <LegalLinks />
  </div>
);
