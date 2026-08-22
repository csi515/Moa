import React from 'react';
import { StorageService } from '@/services/storage';
import { formatCurrency, getAttendanceBadge } from '@/utils/formatters';
import type { ParentPortalTab } from '@/types/education';
import type { Student } from '@/types';
import { Section, StatCard } from './shared';

export function ParentHomeView({ student }: { student: Student; onNavigate: (t: ParentPortalTab) => void }) {
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
