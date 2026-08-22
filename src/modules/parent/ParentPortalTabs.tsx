import React from 'react';
import { StorageService } from '@/services/storage';
import { RecitalService } from '@/modules/piano/services/recitalService';
import {
  formatCurrency,
  formatDate,
  getAttendanceBadge,
  getInvoiceStatusBadge,
} from '@/utils/formatters';
import {
  formatSessionTime,
  getSessionStatusLabel,
} from '@/core/attendance/services/attendanceService';
import type { ParentPortalTab } from '@/types/education';
import type { Student } from '@/types';
import { CheckCircle2, AlertCircle, Award } from 'lucide-react';

export function ParentPortalTabs({
  tab,
  student,
  showToast,
  onRefresh,
}: {
  tab: ParentPortalTab;
  student: Student;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onRefresh: () => void;
}) {
  switch (tab) {
    case 'home':
      return <ParentHomeView student={student} onNavigate={() => {}} />;
    case 'attendance':
      return <ParentAttendanceView student={student} />;
    case 'tuition':
      return <ParentTuitionView student={student} />;
    case 'assignments':
      return <ParentAssignmentsView student={student} showToast={showToast} onRefresh={onRefresh} />;
    case 'progress':
      return <ParentProgressView student={student} />;
    case 'reports':
      return <ParentReportsView student={student} />;
    case 'events':
      return <ParentEventsView student={student} />;
    default:
      return null;
  }
}

function ParentHomeView({ student }: { student: Student; onNavigate: (t: ParentPortalTab) => void }) {
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
        <StatCard label="미납액" value={formatCurrency(summary.grandUnpaid ?? summary.totalUnpaid)} warn={(summary.grandUnpaid ?? summary.totalUnpaid) > 0} />
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

function ParentAttendanceView({ student }: { student: Student }) {
  const sessions = StorageService.getAttendanceSessions()
    .filter((s) => s.customerId === student.id)
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
    .slice(0, 30);

  const legacyRecords = StorageService.getAttendance()
    .filter((a) => a.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  const hasSessions = sessions.length > 0;

  return (
    <Section title={`${student.name} 출결 기록`}>
      {hasSessions ? (
        sessions.map((s) => {
          const status = getSessionStatusLabel(s);
          return (
            <div key={s.id} className="flex justify-between items-center py-2 border-b border-slate-50 text-sm">
              <span className="font-mono">{s.sessionDate}</span>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-700">{status.label}</span>
                <p className="text-[10px] text-slate-400 font-mono">
                  {formatSessionTime(s.checkInAt)} → {formatSessionTime(s.checkOutAt)}
                </p>
              </div>
            </div>
          );
        })
      ) : legacyRecords.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">출결 기록이 없습니다.</p>
      ) : (
        legacyRecords.map((a) => (
          <div key={a.id} className="flex justify-between items-center py-2 border-b border-slate-50 text-sm">
            <span className="font-mono">{a.date}</span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${getAttendanceBadge(a.status).bg}`}>
              {getAttendanceBadge(a.status).label}
            </span>
          </div>
        ))
      )}
    </Section>
  );
}

function ParentTuitionView({ student }: { student: Student }) {
  const summary = StorageService.getStudentBillingSummary(student.id);
  const invoices = StorageService.getInvoices().filter((i) => i.studentId === student.id);
  const sales = StorageService.getTextbookSalesByStudentId(student.id);
  const payments = StorageService.getTextbookPayments().filter((p) => p.studentId === student.id);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-slate-200">
        <p className="text-xs text-slate-500">통합 미납</p>
        <p className={`text-2xl font-black ${(summary.grandUnpaid ?? summary.totalUnpaid) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {formatCurrency(summary.grandUnpaid ?? summary.totalUnpaid)}
        </p>
      </div>

      <Section title="수강료 청구·수납">
        {invoices.slice(0, 12).map((inv) => (
          <div key={inv.id} className="flex justify-between items-center py-2 border-b border-slate-50 text-sm">
            <div>
              <p className="font-bold">{inv.yearMonth}월</p>
              <p className="text-xs text-slate-400">{formatCurrency(inv.totalAmount)}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${getInvoiceStatusBadge(inv.status).bg}`}>
                {getInvoiceStatusBadge(inv.status).label}
              </span>
              {inv.receiptNumber && (
                <p className="text-[10px] text-slate-400 mt-1">영수증 {inv.receiptNumber}</p>
              )}
            </div>
          </div>
        ))}
      </Section>

      {sales.length > 0 && (
        <Section title="교재비">
          {sales.map((s) => (
            <div key={s.id} className="flex justify-between py-2 text-sm border-b border-slate-50">
              <span>{s.textbookTitle}</span>
              <span className={s.unpaidAmount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                {formatCurrency(s.unpaidAmount > 0 ? s.unpaidAmount : s.paidAmount)}
              </span>
            </div>
          ))}
        </Section>
      )}

      {payments.length > 0 && (
        <Section title="납부 영수증">
          {payments.map((p) => (
            <div key={p.id} className="py-2 text-sm border-b border-slate-50">
              <div className="flex justify-between">
                <span>{formatDate(p.paymentDate)}</span>
                <span className="font-bold">{formatCurrency(p.amount)}</span>
              </div>
              {p.receiptNumber && <p className="text-xs text-slate-400">No. {p.receiptNumber}</p>}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function ParentAssignmentsView({
  student,
  showToast,
  onRefresh,
}: {
  student: Student;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onRefresh: () => void;
}) {
  const assignments = StorageService.getWeeklyAssignments(student.id);

  const handleConfirm = (assignmentId: string, itemId: string) => {
    StorageService.confirmAssignmentItem(assignmentId, itemId);
    showToast('과제 완료를 확인했습니다.', 'success');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {assignments.length === 0 ? (
        <Section title="주간 과제">
          <p className="text-sm text-slate-400 text-center py-6">등록된 과제가 없습니다.</p>
        </Section>
      ) : (
        assignments.map((a) => (
          <Section key={a.id} title={a.title || `${a.weekStart} 주 과제`}>
            {a.teacherNotes && <p className="text-xs text-slate-500 mb-2">{a.teacherNotes}</p>}
            {a.items.map((it) => (
              <div key={it.id} className="bg-slate-50 rounded-xl p-3 mb-2">
                <p className="font-bold text-sm">{it.songTitle}</p>
                <p className="text-xs text-slate-600 mt-1">{it.instructions}</p>
                {it.targetMinutes && (
                  <p className="text-xs text-indigo-600 mt-1">목표 연습: {it.targetMinutes}분/일</p>
                )}
                {it.parentConfirmed ? (
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 확인 완료
                  </p>
                ) : (
                  <button
                    onClick={() => handleConfirm(a.id, it.id)}
                    className="mt-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg"
                  >
                    연습 완료 확인
                  </button>
                )}
              </div>
            ))}
          </Section>
        ))
      )}

      <Section title="레슨 과제 메모">
        {StorageService.getLessonRecords()
          .filter((l) => l.studentId === student.id && l.homework)
          .slice(0, 5)
          .map((l) => (
            <div key={l.id} className="py-2 border-b border-slate-50 text-sm">
              <p className="text-xs text-slate-400">{l.date}</p>
              <p>{l.homework}</p>
            </div>
          ))}
      </Section>
    </div>
  );
}

function ParentProgressView({ student }: { student: Student }) {
  const levels = StorageService.getCurriculumLevels();
  const items = StorageService.getCurriculumItems();
  const progress = StorageService.getCurriculumProgress(student.id);
  const achievements = StorageService.getAchievements(student.id);

  const studentLevel = levels.find((l) => l.name === student.level) || levels[0];
  const levelItems = studentLevel ? items.filter((i) => i.levelId === studentLevel.id) : [];

  return (
    <div className="space-y-4">
      <Section title={`커리큘럼 진도 (${student.level})`}>
        {levelItems.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">등록된 커리큘럼이 없습니다.</p>
        ) : (
          levelItems.map((item) => {
            const prog = progress.find((p) => p.curriculumItemId === item.id);
            const status = prog?.status || 'not_started';
            return (
              <div key={item.id} className="flex items-center gap-2 py-2 border-b border-slate-50 text-sm">
                {status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : status === 'in_progress' ? (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                )}
                <span className={status === 'completed' ? 'line-through text-slate-400' : ''}>{item.title}</span>
              </div>
            );
          })
        )}
      </Section>

      <Section title="시험·콩쿠르·등급">
        {achievements.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">기록이 없습니다.</p>
        ) : (
          achievements.map((a) => (
            <div key={a.id} className="py-2 border-b border-slate-50">
              <div className="flex items-start gap-2">
                <Award className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-sm">{a.title}</p>
                  <p className="text-xs text-slate-500">
                    {a.eventDate} · {a.result || a.type}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </Section>

      <Section title="연습 기록">
        {StorageService.getPracticeRecords()
          .filter((p) => p.studentId === student.id)
          .slice(0, 8)
          .map((p) => (
            <div key={p.id} className="py-2 border-b border-slate-50 text-sm">
              <p className="text-xs text-slate-400">{p.date} · {p.minutes}분</p>
              <p>{p.songTitle || p.homework || '연습'}</p>
            </div>
          ))}
      </Section>
    </div>
  );
}

function ParentReportsView({ student }: { student: Student }) {
  const reports = StorageService.getLearningReports(student.id, true);

  return (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <Section title="학습 리포트">
          <p className="text-sm text-slate-400 text-center py-6">발행된 리포트가 없습니다.</p>
        </Section>
      ) : (
        reports.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs text-indigo-600 font-bold">{r.yearMonth} 월간 리포트</p>
            <h3 className="font-black text-lg mt-1">{student.name}</h3>
            {r.summary && <p className="text-sm text-slate-600 mt-2">{r.summary}</p>}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <MiniStat label="출석률" value={`${r.attendanceRate ?? 0}%`} />
              <MiniStat label="연습 시간" value={`${r.practiceMinutes ?? 0}분`} />
              <MiniStat label="레슨" value={`${r.lessonsCount ?? 0}회`} />
              <MiniStat label="완료 곡" value={`${r.songsCompleted ?? 0}곡`} />
            </div>
            {r.strengths && (
              <p className="text-xs mt-3"><strong>잘한 점:</strong> {r.strengths}</p>
            )}
            {r.improvements && (
              <p className="text-xs mt-1"><strong>보완점:</strong> {r.improvements}</p>
            )}
            {r.goalsNextMonth && (
              <p className="text-xs mt-1"><strong>다음 달 목표:</strong> {r.goalsNextMonth}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function ParentEventsView({ student }: { student: Student }) {
  const events = RecitalService.getRecitalEvents().filter((e) =>
    (e.participantIds || []).includes(student.id)
  );

  return (
    <Section title="연주회·콩쿠르 일정">
      {events.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">예정된 행사가 없습니다.</p>
      ) : (
        events.map((ev) => (
          <div key={ev.id} className="py-3 border-b border-slate-50">
            <p className="font-bold text-sm">{ev.title}</p>
            <p className="text-xs text-slate-500 mt-1">{ev.startDate} · {ev.type === 'competition' ? '콩쿠르' : '연주회'}</p>
            {ev.description && <p className="text-xs text-slate-400 mt-1">{ev.description}</p>}
          </div>
        ))
      )}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
      <h3 className="font-bold text-sm text-slate-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function StatCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="bg-white rounded-xl p-3 border border-slate-200">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className={`text-lg font-black ${warn ? 'text-rose-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 text-center">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
