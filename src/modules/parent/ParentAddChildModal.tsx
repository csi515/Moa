import React, { useState } from 'react';
import { Loader2, UserPlus, X } from 'lucide-react';
import {
  GUARDIAN_RELATIONSHIP_LABELS,
  type GuardianRelationship,
} from '@/core/parent/types';
import { registerParentChild } from '@/core/parent/services/parentChildService';

interface ParentAddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ParentAddChildModal: React.FC<ParentAddChildModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [relationship, setRelationship] = useState<GuardianRelationship>('mother');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError('자녀 이름을 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await registerParentChild({
        displayName: displayName.trim(),
        birthDate: birthDate || null,
        relationship,
        isPrimary: true,
      });

      if (result.status === 'existing') {
        onSuccess('이미 등록된 자녀 정보입니다.');
        onClose();
        return;
      }

      onSuccess('자녀 정보가 등록되었습니다.');
      onClose();
      setDisplayName('');
      setBirthDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '자녀 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-600" />
            내 자녀 등록
          </h3>
          <button type="button" onClick={onClose} aria-label="닫기">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          자녀 정보를 먼저 등록한 뒤, 학원에서 받은 연결 코드로 학원과 연결할 수 있습니다.
        </p>

        {error && (
          <div className="mb-3 p-2 rounded-lg bg-rose-50 text-xs text-rose-700">{error}</div>
        )}

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-bold text-slate-500">이름</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl min-h-[44px]"
              placeholder="자녀 이름"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-500">생년월일 (선택)</span>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl min-h-[44px]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-500">관계</span>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as GuardianRelationship)}
              className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl min-h-[44px]"
            >
              {(Object.keys(GUARDIAN_RELATIONSHIP_LABELS) as GuardianRelationship[]).map((key) => (
                <option key={key} value={key}>
                  {GUARDIAN_RELATIONSHIP_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={loading}
          className="mt-5 w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          등록하기
        </button>
      </div>
    </div>
  );
};
