import React, { useState } from 'react';
import { Check, Copy, Link2, Mail, X } from 'lucide-react';
import type { ParentInviteLinkCode } from '@/core/parent/services/parentInviteService';
import { buildParentInviteUrl } from '@/core/parent/services/parentInviteService';
import { GuardianLinkQrDisplay } from '@/modules/parent/components/GuardianLinkQrDisplay';

interface ParentInviteResultModalProps {
  parentName: string;
  email: string;
  organizationName: string;
  linkCodes: ParentInviteLinkCode[];
  emailSent: boolean;
  emailMessage?: string;
  onClose: () => void;
}

export const ParentInviteResultModal: React.FC<ParentInviteResultModalProps> = ({
  parentName,
  email,
  organizationName,
  linkCodes,
  emailSent,
  emailMessage,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const primary = linkCodes[0];

  const handleCopy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-600" />
            초대 완료
          </h3>
          <button type="button" onClick={onClose} aria-label="닫기">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          <strong>{parentName}</strong> ({email}) · {organizationName}
        </p>

        <div
          className={`mb-4 p-3 rounded-xl text-sm flex items-start gap-2 ${
            emailSent ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
          }`}
        >
          <Mail className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            {emailSent ? (
              <p>초대 이메일을 발송했습니다.</p>
            ) : (
              <p>
                이메일 자동 발송이 설정되지 않았습니다. 아래 연결 코드나 링크를 학부모에게
                직접 전달해 주세요.
                {emailMessage ? (
                  <span className="block text-xs mt-1 opacity-80">{emailMessage}</span>
                ) : null}
              </p>
            )}
          </div>
        </div>

        {primary && (
          <div className="mb-4 space-y-3">
            <p className="text-xs font-bold text-slate-500">빠른 연결 링크</p>
            <GuardianLinkQrDisplay url={buildParentInviteUrl(primary.token)} />
            <button
              type="button"
              onClick={() => void handleCopy('link', buildParentInviteUrl(primary.token))}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
            >
              {copiedKey === 'link' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              연결 링크 복사
            </button>
          </div>
        )}

        {linkCodes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500">자녀별 연결 코드</p>
            {linkCodes.map((code) => (
              <div
                key={`${code.customerId}-${code.token}`}
                className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{code.studentName}</p>
                  <p className="text-lg font-black font-mono tracking-widest text-indigo-700">
                    {code.token}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopy(code.token, code.token)}
                  className="p-2 rounded-lg bg-white border border-slate-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={`${code.studentName} 코드 복사`}
                >
                  {copiedKey === code.token ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-500" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {linkCodes.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            연결된 자녀가 없어 코드가 생성되지 않았습니다. 학생-학부모 연결 후 다시 초대해
            주세요.
          </p>
        )}
      </div>
    </div>
  );
};
