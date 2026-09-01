import React from 'react';
import { StorageService } from '@/services/storage';
import { formatCurrency } from '@/utils/formatters';
import {
  formatSessionTime,
  getSessionStatusLabel,
} from '@/core/attendance/services/attendanceService';
import { useParentAttendanceSessions } from '@/core/parent/hooks/useParentAttendanceSessions';
import { getNoticesForStudent, NOTICE_COPY } from '@/core/notices';
import { CARE_JOURNAL_MOOD_LABEL, MEDICATION_STATUS_LABEL } from '@/modules/daycare/care';
import { normalizeIndustryType, type IndustryType } from '@/core/industry/types';
import type { ParentPortalTab } from '@/types/education';
import type { Student } from '@/types';
import { Section, StatCard } from './shared';
import { GymParentHome } from './GymParentHome';
import { PianoParentHome } from './PianoParentHome';
import { PilatesParentHome } from './PilatesParentHome';

export function ParentHomeView({
  student,
  organizationId,
  readOnly = false,
  onNavigate,
  industryType = 'piano',
}: {
  student: Student;
  organizationId: string;
  readOnly?: boolean;
  onNavigate: (t: ParentPortalTab) => void;
  industryType?: IndustryType | string;
}) {
  const industry = normalizeIndustryType(industryType);
  if (industry === 'daycare') {
    return (
      <DaycareParentHome
        student={student}
        organizationId={organizationId}
        readOnly={readOnly}
        onNavigate={onNavigate}
      />
    );
  }
  if (industry === 'gym') {
    return (
      <GymParentHome
        student={student}
        organizationId={organizationId}
        onNavigate={onNavigate}
      />
    );
  }
  if (industry === 'pilates') {
    return <PilatesParentHome student={student} onNavigate={onNavigate} />;
  }
  return (
    <PianoParentHome
      student={student}
      organizationId={organizationId}
      onNavigate={onNavigate}
    />
  );
}

function DaycareParentHome({
  student,
  organizationId,
  readOnly = false,
  onNavigate,
}: {
  student: Student;
  organizationId: string;
  readOnly?: boolean;
  onNavigate: (t: ParentPortalTab) => void;
}) {
  const summary = StorageService.getStudentBillingSummary(student.id);
  const { todaySession } = useParentAttendanceSessions(organizationId, student.id, 7);

  const latestJournal = React.useMemo(
    () =>
      StorageService.getCareJournals()
        .filter((j) => j.studentId === student.id)
        .sort((a, b) => b.journalDate.localeCompare(a.journalDate))[0],
    [student.id]
  );

  const pendingMeds = React.useMemo(
    () =>
      StorageService.getMedicationRequests().filter(
        (r) => r.studentId === student.id && r.status === 'requested'
      ),
    [student.id]
  );

  const recentNotices = React.useMemo(
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
        <button type="button" onClick={() => onNavigate('attendance')} className="text-left">
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
          readOnly ? (
            <p className="text-sm text-slate-400 text-center py-4">투약 기록이 없습니다.</p>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('medications')}
              className="w-full text-sm text-slate-500 py-2"
            >
              대기 중인 투약 의뢰가 없습니다 · 의뢰하기
            </button>
          )
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
