import { StorageService } from '@/services/storage';
import { formatCurrency } from '@/utils/formatters';
import {
  formatSessionTime,
  getSessionStatusLabel,
} from '@/core/attendance/services/attendanceService';
import { useParentAttendanceSessions } from '@/core/parent/hooks/useParentAttendanceSessions';
import type { ParentPortalTab } from '@/types/education';
import type { Student } from '@/types';
import { ChevronRight } from 'lucide-react';
import { Section, StatCard } from './shared';
import { ParentHeroCard, ParentNoticePreview } from './parentHomeShared';

/** 피아노학원 학부모 홈 — 피드백·과제 중심 레이아웃 */
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
  const weekStart = StorageService.getCurrentWeekStart();
  const assignment =
    StorageService.getWeeklyAssignments(student.id).find((a) => a.weekStart === weekStart) ||
    StorageService.getWeeklyAssignments(student.id)[0];
  const latestLesson = StorageService.getLessonRecords()
    .filter((l) => l.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const report = StorageService.getLearningReports(student.id, true)[0];
  const classes = StorageService.getClasses().filter((c) =>
    (student.classIds || []).includes(c.id)
  );
  const makeupItems = StorageService.getMakeupItems().filter(
    (m) => m.studentId === student.id && m.status !== 'completed'
  );
  const pendingMakeup = makeupItems.length;
  const { sessions: recentSessions } = useParentAttendanceSessions(organizationId, student.id, 5);
  const pendingHomework =
    assignment?.items.filter((it) => !it.parentConfirmed).length ?? 0;

  return (
    <div className="space-y-4 pb-2">
      <ParentHeroCard
        student={student}
        subtitle={student.level || '피아노'}
        gradientClass="bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900"
      />

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onNavigate('assignments')} className="text-left">
          <StatCard
            label="미확인 과제"
            value={pendingHomework > 0 ? `${pendingHomework}개` : '없음'}
            warn={pendingHomework > 0}
          />
        </button>
        <button type="button" onClick={() => onNavigate('progress')} className="text-left">
          <StatCard label="진도·연습" value="보기" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onNavigate('tuition')} className="text-left">
          <StatCard
            label="미납액"
            value={formatCurrency(summary.grandUnpaid ?? summary.totalUnpaid)}
            warn={(summary.grandUnpaid ?? summary.totalUnpaid) > 0}
          />
        </button>
        <button type="button" onClick={() => onNavigate('reports')} className="text-left">
          <StatCard label="학습 리포트" value={report ? report.yearMonth : '없음'} />
        </button>
      </div>

      {latestLesson && (
        <Section
          title="최근 레슨 피드백"
          action={
            <button
              type="button"
              onClick={() => onNavigate('assignments')}
              className="text-[11px] font-bold text-indigo-600 min-h-[44px] px-1 inline-flex items-center gap-0.5"
            >
              더보기 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <button
            type="button"
            onClick={() => onNavigate('assignments')}
            className="w-full text-left space-y-3 rounded-xl -mx-0.5 px-0.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-base font-extrabold text-slate-900 leading-snug">
                {latestLesson.songTitle}
              </p>
              <span className="text-[11px] font-mono text-slate-400 shrink-0 pt-0.5">
                {latestLesson.date}
              </span>
            </div>
            {latestLesson.progress && (
              <p className="text-xs font-semibold text-indigo-700 bg-indigo-50 inline-block px-2 py-1 rounded-lg">
                진도 · {latestLesson.progress}
              </p>
            )}
            {(latestLesson.strengths || latestLesson.weaknesses) && (
              <div className="grid grid-cols-1 gap-2">
                {latestLesson.strengths && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                    <p className="text-[11px] font-bold text-emerald-700 mb-0.5">잘한 점</p>
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {latestLesson.strengths}
                    </p>
                  </div>
                )}
                {latestLesson.weaknesses && (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                    <p className="text-[11px] font-bold text-amber-800 mb-0.5">보완점</p>
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {latestLesson.weaknesses}
                    </p>
                  </div>
                )}
              </div>
            )}
            {latestLesson.homework && (
              <div className="rounded-xl bg-indigo-600 text-white px-3.5 py-3">
                <p className="text-[11px] font-bold text-indigo-100 mb-0.5">이번 주 과제</p>
                <p className="text-sm font-semibold leading-relaxed">{latestLesson.homework}</p>
              </div>
            )}
            {!latestLesson.strengths &&
              !latestLesson.weaknesses &&
              latestLesson.lessonContent && (
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {latestLesson.lessonContent}
                </p>
              )}
          </button>
        </Section>
      )}

      {assignment && assignment.items.length > 0 && (
        <Section title="이번 주 과제">
          <button
            type="button"
            onClick={() => onNavigate('assignments')}
            className="w-full text-left space-y-2"
          >
            {assignment.items.slice(0, 3).map((it) => (
              <div
                key={it.id}
                className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5"
              >
                <span
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                    it.parentConfirmed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-white border border-slate-200 text-slate-400'
                  }`}
                >
                  {it.parentConfirmed ? '✓' : ''}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{it.songTitle}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{it.instructions}</p>
                </div>
              </div>
            ))}
          </button>
        </Section>
      )}

      {classes.length > 0 && (
        <Section title="내 수업">
          <button
            type="button"
            onClick={() => onNavigate('schedule')}
            className="w-full text-left space-y-2"
          >
            {classes.slice(0, 3).map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2.5 min-h-[48px]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{cls.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {cls.daysOfWeek.join('·')} {cls.startTime}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </div>
            ))}
          </button>
        </Section>
      )}

      {pendingMakeup > 0 && (
        <Section title="보강">
          <button
            type="button"
            onClick={() => onNavigate('attendance')}
            className="w-full text-left rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3 space-y-1.5"
          >
            <p className="text-sm font-bold text-amber-900">
              보강 대기·예정 {pendingMakeup}건
            </p>
            {makeupItems
              .filter((m) => m.status === 'scheduled')
              .slice(0, 2)
              .map((m) => (
                <p key={m.attendanceId} className="text-xs font-medium text-amber-800">
                  {m.makeUpDate}
                  {m.makeUpStartTime ? ` ${m.makeUpStartTime}` : ''}
                  {m.makeUpRoom ? ` · ${m.makeUpRoom}` : ''}
                </p>
              ))}
          </button>
        </Section>
      )}

      {report && (
        <Section title="최근 학습 리포트">
          <button type="button" onClick={() => onNavigate('reports')} className="w-full text-left">
            <p className="text-sm font-bold">{report.yearMonth}</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {report.summary}
            </p>
          </button>
        </Section>
      )}

      {recentSessions.length > 0 && (
        <Section title="최근 출결">
          <button type="button" onClick={() => onNavigate('attendance')} className="w-full text-left">
            <ul className="divide-y divide-slate-50">
              {recentSessions.map((s) => {
                const status = getSessionStatusLabel(s);
                return (
                  <li key={s.id} className="flex justify-between text-sm py-2.5 min-h-[44px] items-center">
                    <span className="font-mono text-slate-600">{s.sessionDate}</span>
                    <span className="text-slate-800 font-medium">
                      {status.label}
                      {s.checkInAt ? ` · ${formatSessionTime(s.checkInAt)}` : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
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
