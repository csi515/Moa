import React, { useState } from 'react';
import { Save } from 'lucide-react';
import {
  getOrganizationPublicCodeError,
  normalizeOrganizationPublicCode,
  ORGANIZATION_PUBLIC_CODE_MAX_LENGTH,
  ORGANIZATION_PUBLIC_CODE_MIN_LENGTH,
} from '../publicCode';
import { updateOrganizationPublicCode } from '../services/organizationService';

interface Props {
  organizationId: string;
  publicCode: string;
  onUpdated: (publicCode: string) => void;
}

/** 업체 공개 코드 변경 (원장/관리자) */
export const OrganizationPublicCodeEditor: React.FC<Props> = ({
  organizationId,
  publicCode,
  onUpdated,
}) => {
  const [draft, setDraft] = useState(publicCode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setDraft(publicCode);
  }, [publicCode]);

  const normalized = normalizeOrganizationPublicCode(draft);
  const validationError = getOrganizationPublicCodeError(normalized);
  const unchanged = normalized === publicCode;

  const handleSave = async () => {
    if (validationError || unchanged) return;

    setSaving(true);
    setError(null);

    const result = await updateOrganizationPublicCode(organizationId, normalized);
    setSaving(false);

    if ('error' in result) {
      const messages: Record<string, string> = {
        already_taken: '이미 사용 중인 업체 코드입니다.',
        invalid_format: '업체 코드 형식이 올바르지 않습니다.',
        forbidden: '업체 코드를 변경할 권한이 없습니다.',
        not_found: 'Organization을 찾을 수 없습니다.',
        not_authenticated: '로그인이 필요합니다.',
      };
      setError(messages[result.error] ?? '업체 코드 변경에 실패했습니다.');
      return;
    }

    setDraft(result.publicCode);
    onUpdated(result.publicCode);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-slate-900">업체 코드</p>
        <p className="text-xs text-slate-500 mt-1">
          상담 QR·공개 예약 URL 식별용입니다. 내부 ID와 별개이며, 변경해도 기존 데이터에는
          영향이 없습니다.
        </p>
      </div>

      <input
        type="text"
        value={draft}
        onChange={(e) => {
          setDraft(normalizeOrganizationPublicCode(e.target.value));
          setError(null);
        }}
        maxLength={ORGANIZATION_PUBLIC_CODE_MAX_LENGTH}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 font-mono text-sm tracking-wider uppercase"
        aria-label="업체 코드"
      />

      <p className="text-[11px] text-slate-400">
        {ORGANIZATION_PUBLIC_CODE_MIN_LENGTH}~{ORGANIZATION_PUBLIC_CODE_MAX_LENGTH}자 · 영문·숫자
        (0/O, 1/I/l 제외)
      </p>

      {(validationError || error) && (
        <p className="text-xs text-red-600">{validationError ?? error}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !!validationError || unchanged}
        className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        업체 코드 저장
      </button>
    </div>
  );
};
