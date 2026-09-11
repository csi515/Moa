import type { FC } from 'react';
import { CheckSquare, Clock, XCircle } from 'lucide-react';
import type { Student } from '@/types';
import { STATUS_META, type DayStatus } from './pianoAttendanceHelpers';

interface PianoAttendanceRowProps {
  student: Student;
  status: DayStatus;
  pinCheckedIn: boolean;
  hasDayRecord: boolean;
  onOpenStudent: () => void;
  onSetStatus: (status: Exclude<DayStatus, 'unchecked'>) => void;
}

const ACTION_BUTTONS = [
  ['present', CheckSquare],
  ['late', Clock],
  ['absent', XCircle],
] as const;

export const PianoAttendanceRow: FC<PianoAttendanceRowProps> = ({
  student,
  status,
  pinCheckedIn,
  hasDayRecord,
  onOpenStudent,
  onSetStatus,
}) => (
  <li className="flex flex-col sm:flex-row sm:items-center gap-3 px-3 sm:px-4 py-3">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onOpenStudent}
          className="font-bold text-slate-900 text-sm hover:text-indigo-600"
        >
          {student.name}
        </button>
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${STATUS_META[status].tone}`}>
          {!hasDayRecord && pinCheckedIn ? 'PIN 체크인' : STATUS_META[status].label}
        </span>
        {pinCheckedIn && hasDayRecord && (
          <span className="text-[10px] font-semibold text-indigo-500">PIN</span>
        )}
      </div>
      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
        {[student.school, student.grade].filter(Boolean).join(' · ') || '학생'}
      </p>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {ACTION_BUTTONS.map(([key, Icon]) => (
        <button
          key={key}
          type="button"
          onClick={() => onSetStatus(key)}
          className={`inline-flex items-center gap-1 px-3 py-2 min-h-[44px] rounded-xl border text-[11px] font-bold transition-colors ${
            status === key ? STATUS_META[key].active : STATUS_META[key].button
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {STATUS_META[key].label}
        </button>
      ))}
    </div>
  </li>
);
