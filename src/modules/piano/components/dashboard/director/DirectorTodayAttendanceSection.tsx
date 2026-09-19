import { useCallback, useMemo, useState, type FC } from 'react';
import { UserCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useStaffScope, useStorageRefresh } from '@/hooks';
import { StorageService } from '@/services/storage';
import { StudentService } from '@/core/students';
import type { Student } from '@/types';
import {
  DAY_ATTENDANCE_CLASS_ID,
  markDayPresent,
  resolveDayStatus,
  STATUS_META,
  todayIsoLocal,
  type DayStatus,
} from '../../attendance/pianoAttendanceHelpers';

interface DirectorTodayAttendanceSectionProps {
  onOpenAttendance?: () => void;
}

/** 원장 홈 — 오늘 등원 리스트 + 1탭 등원 */
export const DirectorTodayAttendanceSection: FC<DirectorTodayAttendanceSectionProps> = ({
  onOpenAttendance,
}) => {
  const { showToast, triggerRefresh, currentUser } = useApp();
  const refreshKey = useStorageRefresh();
  const { scopeStudents } = useStaffScope();
  const [busyId, setBusyId] = useState<string | null>(null);
  const today = todayIsoLocal();

  const students = useMemo(() => {
    void refreshKey;
    return scopeStudents(StudentService.getActiveStudents());
  }, [refreshKey, scopeStudents]);

  const dayRecordMap = useMemo(() => {
    void refreshKey;
    return new Map(
      StorageService.getAttendance()
        .filter((r) => r.date === today && r.classId === DAY_ATTENDANCE_CLASS_ID)
        .map((r) => [r.studentId, r])
    );
  }, [refreshKey, today]);

  const pinCheckInIds = useMemo(() => {
    void refreshKey;
    return new Set(
      StorageService.getAttendanceSessions()
        .filter((s) => s.sessionDate === today && s.checkInAt)
        .map((s) => s.customerId)
    );
  }, [refreshKey, today]);

  const rows = useMemo(() => {
    return students
      .map((s) => ({
        student: s,
        status: resolveDayStatus(dayRecordMap.get(s.id), pinCheckInIds.has(s.id)),
      }))
      .sort((a, b) => {
        const rank = (st: DayStatus) => (st === 'unchecked' ? 0 : st === 'late' ? 1 : 2);
        const d = rank(a.status) - rank(b.status);
        if (d !== 0) return d;
        return a.student.name.localeCompare(b.student.name, 'ko');
      });
  }, [students, dayRecordMap, pinCheckInIds]);

  const uncheckedCount = rows.filter((r) => r.status === 'unchecked').length;

  const markPresent = useCallback(
    (student: Student) => {
      setBusyId(student.id);
      try {
        const result = markDayPresent({
          student,
          date: today,
          createdBy: currentUser.name,
          existing: dayRecordMap.get(student.id) || null,
        });
        if (!result.ok) {
          showToast(result.warning, 'warning');
          return;
        }
        showToast(`${student.name} 등원 처리되었습니다.`, 'success');
        triggerRefresh();
      } finally {
        setBusyId(null);
      }
    },
    [dayRecordMap, today, currentUser.name, showToast, triggerRefresh]
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            오늘 등원
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            미등원 {uncheckedCount}명 · 재원 {students.length}명
          </p>
        </div>
        {onOpenAttendance && (
          <button
            type="button"
            onClick={onOpenAttendance}
            className="text-xs font-bold text-indigo-600 min-h-[44px] px-1"
          >
            전체
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">등록된 재원생이 없습니다.</p>
      ) : (
        <ul className="space-y-1.5 max-h-[320px] overflow-y-auto">
          {rows.map(({ student, status }) => (
            <li
              key={student.id}
              className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border border-slate-100 bg-slate-50/60 min-h-[52px]"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{student.name}</p>
                <span
                  className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${STATUS_META[status].tone}`}
                >
                  {STATUS_META[status].label}
                </span>
              </div>
              {status === 'unchecked' ? (
                <button
                  type="button"
                  disabled={busyId === student.id}
                  onClick={() => markPresent(student)}
                  className="shrink-0 min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50"
                >
                  등원
                </button>
              ) : (
                <span className="shrink-0 text-xs font-bold text-emerald-700 px-2">완료</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
