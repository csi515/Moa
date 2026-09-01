import React, { useState } from 'react';
import { Copy, Link2, Loader2, X, Check } from 'lucide-react';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { createGuardianLinkToken } from '@/core/parent/services/guardianLinkService';
import { buildParentInviteUrl } from '@/core/parent/services/parentInviteService';

interface GuardianLinkInviteModalProps {
  studentId: string;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const GuardianLinkInviteModal: React.FC<GuardianLinkInviteModalProps> = ({
  studentId,
  studentName,
  isOpen,
  onClose,
}) => {
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!currentOrganization?.id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await createGuardianLinkToken(currentOrganization.id, studentId, 7, 1);
      setToken(result.token);
      setExpiresAt(result.expiresAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : '코드 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!token) return;
    const link = buildParentInviteUrl(token);
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setToken(null);
    setExpiresAt(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-600" />
            보호자 연결 코드
          </h3>
          <button type="button" onClick={handleClose} aria-label="닫기">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          <strong>{studentName}</strong> 학부모가 코드로 자녀를 연결할 수 있습니다.
        </p>

        {error && (
          <div className="mb-3 p-2 rounded-lg bg-rose-50 text-xs text-rose-700">{error}</div>
        )}

        {!token ? (
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            8자리 코드 생성
          </button>
        ) : (
          <div className="space-y-3">
            <div className="text-center p-4 bg-indigo-50 rounded-xl">
              <p className="text-[10px] text-indigo-600 font-bold uppercase mb-1">연결 코드</p>
              <p className="text-3xl font-black font-mono tracking-[0.3em] text-indigo-900">
                {token}
              </p>
              {expiresAt && (
                <p className="text-[10px] text-slate-500 mt-2">
                  {new Date(expiresAt).toLocaleDateString('ko-KR')}까지 유효
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleCopyCode()}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 min-h-[44px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                코드 복사
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 min-h-[44px]"
              >
                <Copy className="w-3.5 h-3.5" />
                링크 복사
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
