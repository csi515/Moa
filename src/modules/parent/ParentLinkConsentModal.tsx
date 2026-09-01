import React from 'react';
import { Shield, X } from 'lucide-react';
import {
  ACADEMY_SHARED_FIELD_LABELS,
  DEFAULT_ACADEMY_SHARED_FIELDS,
  type AcademySharedField,
} from '@/core/parent/services/parentChildService';

interface ParentLinkConsentModalProps {
  isOpen: boolean;
  organizationName?: string;
  studentName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ParentLinkConsentModal: React.FC<ParentLinkConsentModalProps> = ({
  isOpen,
  organizationName,
  studentName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const fields = DEFAULT_ACADEMY_SHARED_FIELDS.map(
    (key) => ACADEMY_SHARED_FIELD_LABELS[key as AcademySharedField]
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            학원 연결 동의
          </h3>
          <button type="button" onClick={onCancel} aria-label="닫기">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          <strong>{organizationName || '학원'}</strong>
          {studentName ? ` · ${studentName}` : ''} 연결 시 아래 정보가 학원에 제공됩니다.
        </p>

        <ul className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700 space-y-1">
          {fields.map((label) => (
            <li key={label}>· {label}</li>
          ))}
        </ul>

        <p className="mt-3 text-xs text-slate-500">
          동의하지 않으면 연결을 진행할 수 없습니다. 제공 항목은 추후 확장될 수 있습니다.
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 text-sm font-bold rounded-xl min-h-[44px]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl min-h-[44px]"
          >
            동의하고 연결
          </button>
        </div>
      </div>
    </div>
  );
};
