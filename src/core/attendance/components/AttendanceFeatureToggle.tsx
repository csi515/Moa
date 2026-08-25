import type { FC } from 'react';
import { KeyRound } from 'lucide-react';
import { ToggleSwitch } from '@/shared/components/ui/ToggleSwitch';

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  /** 스위치 색상 (업종 테마) */
  activeClassName?: string;
}

/** 사업장 설정 — 출입 관리(핀번호) on/off */
export const AttendanceFeatureToggle: FC<Props> = ({
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
    <ToggleSwitch
      enabled={enabled}
      onChange={onChange}
      ariaLabel="출입 관리 핀번호"
      activeClassName={activeClassName}
    />
  </div>
);
