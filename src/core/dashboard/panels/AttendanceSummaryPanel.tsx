import type { FC, ReactNode } from 'react';
import { CheckSquare } from 'lucide-react';
import { DASHBOARD_ACCENT_STYLES, type DashboardAccent } from './dashboardAccent';

interface AttendanceSummaryPanelProps {
  title: string;
  checkedInLabel: string;
  activeLabel: string;
  checkedInToday: number;
  activeCount: number;
  accent: DashboardAccent;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  footer?: ReactNode;
}

export const AttendanceSummaryPanel: FC<AttendanceSummaryPanelProps> = ({
  title,
  checkedInLabel,
  activeLabel,
  checkedInToday,
  activeCount,
  accent,
  primaryActionLabel,
  onPrimaryAction,
  footer,
}) => {
  const styles = DASHBOARD_ACCENT_STYLES[accent];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
        <CheckSquare className="w-4 h-4 text-emerald-600" />
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <p className="text-xs text-emerald-700 font-semibold">{checkedInLabel}</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{checkedInToday}명</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xs text-slate-500 font-semibold">{activeLabel}</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{activeCount}명</p>
        </div>
      </div>
      {footer ? (
        footer
      ) : (
        <button
          type="button"
          onClick={onPrimaryAction}
          className={`mt-4 w-full py-3 min-h-[44px] rounded-xl border text-xs font-bold transition-colors ${styles.outlineButton}`}
        >
          {primaryActionLabel}
        </button>
      )}
    </div>
  );
};
