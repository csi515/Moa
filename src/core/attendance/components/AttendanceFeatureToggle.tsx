import React from 'react';
import { KeyRound } from 'lucide-react';

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  /** 스위치 색상 (업종 테마) */
  activeClassName?: string;
}

/** 사업장 설정 — 출입 관리(핀번호) on/off */
export const AttendanceFeatureToggle: React.FC<Props> = ({
  enabled,
  onChange,
  activeClassName = 'bg-indigo-600',
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
        <KeyRound className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        출입 관리 (핀번호)
      </p>
      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
        회원별 PIN으로 입·퇴실을 기록합니다. 끄면 출입 메뉴·PIN 설정이 숨겨지며, 기존 기록은
        유지됩니다.
      </p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="출입 관리 핀번호"
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-7 rounded-full transition-colors shrink-0 min-h-[28px] ${
        enabled ? activeClassName : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
          enabled ? 'translate-x-5' : ''
        }`}
      />
    </button>
  </div>
);
