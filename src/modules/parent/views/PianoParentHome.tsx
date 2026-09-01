import { StorageService } from '@/services/storage';
import { formatCurrency } from '@/utils/formatters';
import {
  formatSessionTime,
  getSessionStatusLabel,
} from '@/core/attendance/services/attendanceService';
import { useParentAttendanceSessions } from '@/core/parent/hooks/useParentAttendanceSessions';
import type { ParentPortalTab } from '@/types/education';
import type { Student } from '@/types';
import { Section, StatCard } from './shared';
import { ParentHeroCard, ParentNoticePreview } from './parentHomeShared';

/** 피아노학원 학부모 홈 */
export function PianoParentHome({
  student,
  organizationId,
  onNavigate,
}: {
  student: Student;
  organizationId: string;
  onNavigate: (t: ParentPortalTab) => void;
}) {
  const summary = StorageService.getStudentBillingSummary(student.id);
  const assignment = StorageService.getWeeklyAssignments(student.id)[0];
  const report = StorageService.getLearningReports(student.id, true)[0];
  const classes = StorageService.getClasses().filter((c) =>
    (student.classIds || []).includes(c.id)
  );
  const pendingMakeup = StorageService.getMakeupItems().filter(
    (m) => m.studentId === student.id && m.status !== 'completed'
  ).length;
  const { sessions: recentSessions } = useParentAttendanceSessions(organizationId, student.id, 5);

  return (
    <div className="space-y-4">
      <ParentHeroCard
        student={student}
        subtitle={student.level || '피아노'}
        gradientClass="bg-gradient-to-br from-indigo-600 to-indigo-800"
      />

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onNavigate('tuition')} className="text-left">
          <StatCard
            label="미납액"
            value={formatCurrency(summary.grandUnpaid ?? summary.totalUnpaid)}
            warn={(summary.grandUnpaid ?? summary.totalUnpaid) > 0}
          />
        </button>
        <button type="button" onClick={() => onNavigate('assignments')} className="text-left">
          <StatCard
            label="이번 주 과제"
            value={assignment ? `${assignment.items.length}개` : '없음'}
          />
        </button>
      </div>

      {classes.length > 0 && (
        <Section title="내 수업">
          <button type="button" onClick={() => onNavigate('schedule')} className="w-full text-left space-y-2">
            {classes.slice(0, 3).map((cls) => (
              <p key={cls.id} className="text-sm text-slate-700">
                <span className="font-bold">{cls.name}</span>
                <span className="text-slate-500 text-xs ml-2">
                  {cls.daysOfWeek.join('·')} {cls.startTime}
                </span>
              </p>
            ))}
          </button>
        </Section>
      )}

      {assignment && assignment.items.length > 0 && (
        <Section title="이번 주 과제">
          <button type="button" onClick={() => onNavigate('assignments')} className="w-full text-left">
            {assignment.items.slice(0, 3).map((it) => (
              <p key={it.id} className="text-sm text-slate-700 py-1">
                {it.parentConfirmed ? '✓' : '○'} {it.songTitle} — {it.instructions}
              </p>
            ))}
          </button>
        </Section>
      )}

      {pendingMakeup > 0 && (
        <Section title="보강">
          <button
            type="button"
            onClick={() => onNavigate('attendance')}
            className="w-full text-left text-sm text-amber-800 font-semibold"
          >
            보강 대기·예정 {pendingMakeup}건 · 출결에서 확인
          </button>
        </Section>
      )}

      {report && (
        <Section title="최근 학습 리포트">
          <button type="button" onClick={() => onNavigate('reports')} className="w-full text-left">
            <p className="text-sm font-bold">{report.yearMonth}</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{report.summary}</p>
          </button>
        </Section>
      )}

      {recentSessions.length > 0 && (
        <Section title="최근 출결">
          <button type="button" onClick={() => onNavigate('attendance')} className="w-full text-left">
            {recentSessions.map((s) => {
              const status = getSessionStatusLabel(s);
              return (
                <div key={s.id} className="flex justify-between text-sm py-1">
                  <span className="font-mono">{s.sessionDate}</span>
                  <span>{status.label}</span>
                </div>
              );
            })}
          </button>
        </Section>
      )}

      <ParentNoticePreview
        student={student}
        organizationId={organizationId}
        onNavigate={onNavigate}
      />
    </div>
  );
}
