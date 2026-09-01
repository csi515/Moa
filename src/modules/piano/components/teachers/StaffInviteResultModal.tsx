import React, { useState } from 'react';
import { Check, Copy, Link2, Share2, X } from 'lucide-react';
import type { StaffInviteLinkCode } from '@/core/staff/services/staffInviteLinkService';
import {
  buildStaffInviteUrl,
  shareInviteLink,
} from '@/core/staff/services/staffInviteLinkService';
import { GuardianLinkQrDisplay } from '@/modules/parent/components/GuardianLinkQrDisplay';

interface StaffInviteResultModalProps {
  staffName: string;
  organizationName: string;
  email?: string;
  linkCode: StaffInviteLinkCode;
  onClose: () => void;
}

export const StaffInviteResultModal: React.FC<StaffInviteResultModalProps> = ({
  staffName,
  organizationName,
  email,
  linkCode,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const inviteUrl = buildStaffInviteUrl(linkCode.token);
  const shareText = `${organizationName} 강사 계정 초대 — ${staffName} 선생님, 아래 링크로 가입·연결해 주세요.`;

  const handleCopy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const result = await shareInviteLink({
        title: `${organizationName} 강사 초대`,
        text: shareText,
        url: inviteUrl,
      });
      if (result === 'copied') {
        setCopiedKey('share');
        setTimeout(() => setCopiedKey(null), 2000);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-600" />
            강사 초대 링크
          </h3>
          <button type="button" onClick={onClose} aria-label="닫기">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          <strong>{staffName}</strong>
          {email ? ` (${email})` : ''} · {organizationName}
        </p>

        <div className="mb-4 p-3 rounded-xl bg-indigo-50 text-indigo-900 text-sm">
          카카오톡·문자 등 SNS로 링크를 보내거나, QR 코드를 보여 주세요. 강사가 링크로
          가입·로그인하면 자동으로 계정이 연결됩니다.
        </div>

        <div className="mb-4 space-y-3">
          <p className="text-xs font-bold text-slate-500">연결 코드</p>
          <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
            <p className="text-xl font-black font-mono tracking-widest text-indigo-700">
              {linkCode.token}
            </p>
            <button
              type="button"
              onClick={() => void handleCopy('code', linkCode.token)}
              className="p-2 rounded-lg bg-white border border-slate-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="연결 코드 복사"
            >
              {copiedKey === 'code' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        <div className="mb-4 space-y-3">
          <p className="text-xs font-bold text-slate-500">초대 링크</p>
          <GuardianLinkQrDisplay url={inviteUrl} label="QR로 연결" />
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={sharing}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-60"
          >
            {copiedKey === 'share' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {sharing ? '공유 준비 중...' : 'SNS로 링크 보내기'}
          </button>
          <button
            type="button"
            onClick={() => void handleCopy('link', inviteUrl)}
            className="w-full py-2.5 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
          >
            {copiedKey === 'link' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            링크 복사
          </button>
        </div>

        {linkCode.expiresAt && (
          <p className="text-[11px] text-slate-400 text-center">
            만료: {new Date(linkCode.expiresAt).toLocaleDateString('ko-KR')}
          </p>
        )}
      </div>
    </div>
  );
};
