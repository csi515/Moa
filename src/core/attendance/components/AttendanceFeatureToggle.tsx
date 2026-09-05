import type { FC } from 'react';
import { KeyRound } from 'lucide-react';
import { ToggleSwitch } from '@/shared/components/ui/ToggleSwitch';

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  /** 스위치 색상 (업종 테마) */
  activeClassName?: string;
  /** 아이콘 색상 (업종 테마) */
  iconClassName?: string;
  /** false면 토글 비활성 (권한 없음) */
  canEdit?: boolean;
}

/** 사업장 설정 — 학생 PIN 출결 on/off */
export const AttendanceFeatureToggle: FC<Props> = ({
  enabled,
  onChange,
  activeClassName = 'bg-indigo-600',
  iconClassName = 'text-indigo-600',
  canEdit = true,
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
        <KeyRound className={`w-3.5 h-3.5 shrink-0 ${iconClassName}`} />
        학생 PIN 출결
      </p>
      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
        {enabled
          ? '학생이 입구 태블릿에서 PIN으로 출석할 수 있습니다. 끄면 PIN·키오스크 메뉴가 숨겨지며, 기존 PIN·출석 기록은 유지됩니다.'
          : '선생님·관리자가 직접 출석을 처리합니다. 켜면 학생 PIN 발급과 출석 키오스크를 사용할 수 있습니다.'}
      </p>
      {!canEdit && (
        <p className="text-[11px] text-amber-700 mt-1">원장·관리자만 출결 방식을 변경할 수 있습니다.</p>
      )}
    </div>
    <ToggleSwitch
      enabled={enabled}
      onChange={onChange}
      ariaLabel="학생 PIN 출결"
      activeClassName={activeClassName}
      disabled={!canEdit}
    />
  </div>
);
