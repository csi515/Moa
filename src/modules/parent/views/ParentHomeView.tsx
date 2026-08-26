import React, { useMemo } from 'react';
import { StorageService } from '@/services/storage';
import { formatCurrency, getAttendanceBadge } from '@/utils/formatters';
import {
  formatSessionTime,
  getSessionStatusLabel,
} from '@/core/attendance/services/attendanceService';
import { getNoticesForStudent, NOTICE_COPY } from '@/core/notices';
import { CARE_JOURNAL_MOOD_LABEL, MEDICATION_STATUS_LABEL } from '@/modules/daycare/care';
import type { IndustryType } from '@/core/industry/types';
import type { ParentPortalTab } from '@/types/education';
import type { Student } from '@/types';
import { Section, StatCard } from './shared';

export function ParentHomeView({
  student,
  onNavigate,
  industryType = 'piano',
}: {
  student: Student;
  onNavigate: (t: ParentPortalTab) => void;
  industryType?: IndustryType | string;
}) {
  if (industryType === 'daycare') {
    return <DaycareParentHome student={student} onNavigate={onNavigate} />;
  }
  return <AcademyParentHome student={student} />;
}

function AcademyParentHome({ student }: { student: Student }) {
  const summary = StorageService.getStudentBillingSummary(student.id);
  const recentAtt = StorageService.getAttendance()
    .filter((a) => a.studentId === student.id)
    .slice(0, 5);
  const assignment = StorageService.getWeeklyAssignments(student.id)[0];
  const report = StorageService.getLearningReports(student.id, true)[0];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white">
        <p className="text-indigo-200 text-xs">{student.level}</p>
        <h2 className="text-2xl font-black mt-1">{student.name}</h2>
        <p className="text-sm text-indigo-100 mt-1">담당: {student.teacherName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="미납액"
          value={formatCurrency(summary.grandUnpaid ?? summary.totalUnpaid)}
          warn={(summary.grandUnpaid ?? summary.totalUnpaid) > 0}
        />
        <StatCard label="이번 주 과제" value={assignment ? `${assignment.items.length}개` : '없음'} />
      </div>

      {assignment && assignment.items.length > 0 && (
        <Section title="이번 주 과제">
          {assignment.items.slice(0, 3).map((it) => (
            <p key={it.id} className="text-sm text-slate-700 py-1">
              {it.parentConfirmed ? '✅' : '⬜'} {it.songTitle} — {it.instructions}
            </p>
          ))}
        </Section>
      )}

      {report && (
        <Section title="최근 학습 리포트">
          <p className="text-sm font-bold">{report.yearMonth}</p>
          <p className="text-xs text-slate-500 mt-1">{report.summary}</p>
        </Section>
      )}

      {recentAtt.length > 0 && (
        <Section title="최근 출결">
          {recentAtt.map((a) => (
            <div key={a.id} className="flex justify-between text-sm py-1">
              <span>{a.date}</span>
              <span>{getAttendanceBadge(a.status).label}</span>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function DaycareParentHome({
  student,
  onNavigate,
}: {
  student: Student;
  onNavigate: (t: ParentPortalTab) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const summary = StorageService.getStudentBillingSummary(student.id);

  const todaySession = useMemo(
    () =>
      StorageService.getAttendanceSessions().find(
        (s) => s.customerId === student.id && s.sessionDate === today
      ),
    [student.id, today]
  );

  const latestJournal = useMemo(
    () =>
      StorageService.getCareJournals()
        .filter((j) => j.studentId === student.id)
        .sort((a, b) => b.journalDate.localeCompare(a.journalDate))[0],
    [student.id]
  );

  const pendingMeds = useMemo(
    () =>
      StorageService.getMedicationRequests().filter(
        (r) => r.studentId === student.id && r.status === 'requested'
      ),
    [student.id]
  );

  const recentNotices = useMemo(
    () => getNoticesForStudent(StorageService.getNotifications(), student).slice(0, 3),
    [student]
  );

  const sessionStatus = getSessionStatusLabel(todaySession);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-sky-600 to-indigo-800 rounded-2xl p-5 text-white">
        <p className="text-sky-100 text-xs">{student.grade || '원아'}</p>
        <h2 className="text-2xl font-black mt-1">{student.name}</h2>
        <p className="text-sm text-sky-100 mt-1">
          담당: {student.teacherName || '미지정'}
        </p>
        {student.specialNotes && (
          <p className="mt-3 text-xs bg-white/15 rounded-xl px-3 py-2 leading-relaxed">
            주의 · {student.specialNotes}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('attendance')}
          className="text-left"
        >
          <StatCard label="오늘 등하원" value={sessionStatus.label} />
        </button>
        <button type="button" onClick={() => onNavigate('tuition')} className="text-left">
          <StatCard
            label="미납 보육료"
            value={formatCurrency(summary.grandUnpaid ?? summary.totalUnpaid)}
            warn={(summary.grandUnpaid ?? summary.totalUnpaid) > 0}
          />
        </button>
      </div>

      {todaySession && (todaySession.checkInAt || todaySession.checkOutAt) && (
        <Section title="오늘 등·하원 시각">
          <p className="text-sm text-slate-700 font-mono">
            {formatSessionTime(todaySession.checkInAt)} → {formatSessionTime(todaySession.checkOutAt)}
          </p>
          {todaySession.memo && (
            <p className="text-xs text-slate-500 mt-2">메모 · {todaySession.memo}</p>
          )}
        </Section>
      )}

      <Section title="최근 알림장">
        {latestJournal ? (
          <button type="button" onClick={() => onNavigate('journals')} className="w-full text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold font-mono">{latestJournal.journalDate}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700">
                {CARE_JOURNAL_MOOD_LABEL[latestJournal.mood]}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 line-clamp-2">{latestJournal.teacherNote}</p>
          </button>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">아직 알림장이 없습니다.</p>
        )}
      </Section>

      <Section title="투약 대기">
        {pendingMeds.length === 0 ? (
          <button
            type="button"
            onClick={() => onNavigate('medications')}
            className="w-full text-sm text-slate-500 py-2"
          >
            대기 중인 투약 의뢰가 없습니다 · 의뢰하기
          </button>
        ) : (
          <ul className="space-y-2">
            {pendingMeds.slice(0, 3).map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onNavigate('medications')}
                  className="w-full flex justify-between items-center text-left text-sm"
                >
                  <span className="font-semibold text-slate-800">{m.medicineName}</span>
                  <span className="text-[10px] font-bold text-amber-700">
                    {MEDICATION_STATUS_LABEL[m.status]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={NOTICE_COPY.parentSectionTitle}>
        {recentNotices.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">{NOTICE_COPY.parentEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {recentNotices.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onNavigate('notices')}
                  className="w-full text-left"
                >
                  <p className="text-sm font-bold text-slate-800 truncate">{n.title}</p>
                  <p className="text-[11px] text-slate-400">
                    {(n.sentAt || n.createdAt || '').slice(0, 10)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
