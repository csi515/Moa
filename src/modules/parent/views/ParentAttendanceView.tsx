import React from 'react';
import { StorageService } from '@/services/storage';
import { getAttendanceBadge } from '@/utils/formatters';
import {
  formatSessionTime,
  getSessionStatusLabel,
} from '@/core/attendance/services/attendanceService';
import { normalizeIndustryType, type IndustryType } from '@/core/industry/types';
import type { MakeupStatus, Student } from '@/types';
import { Section } from './shared';

const MAKEUP_STATUS_LABEL: Record<MakeupStatus, string> = {
  pending: '보강 대기',
  scheduled: '보강 예정',
  completed: '보강 완료',
};

export function ParentAttendanceView({
  student,
  industryType = 'piano',
}: {
  student: Student;
  industryType?: IndustryType | string;
}) {
  const industry = normalizeIndustryType(industryType);
  const sessions = StorageService.getAttendanceSessions()
    .filter((s) => s.customerId === student.id)
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
    .slice(0, 30);

  const legacyRecords = StorageService.getAttendance()
    .filter((a) => a.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  const makeups =
    industry === 'piano'
      ? StorageService.getMakeupItems()
          .filter((m) => m.studentId === student.id)
          .slice(0, 15)
      : [];

  const hasSessions = sessions.length > 0;
  const title =
    industry === 'daycare'
      ? `${student.name} 등하원 기록`
      : industry === 'pilates'
        ? `${student.name} 출입 기록`
        : `${student.name} 출결 기록`;

  return (
    <div className="space-y-4">
      {makeups.length > 0 && (
        <Section title="보강 현황">
          {makeups.map((m) => (
            <div key={m.attendanceId} className="py-2 border-b border-slate-50 text-sm">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-slate-800">{m.className || '수업'}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    결석 {m.originalDate}
                    {m.makeUpDate ? ` → 보강 ${m.makeUpDate}` : ''}
                  </p>
                  {m.absentReason && (
                    <p className="text-[11px] text-slate-500 mt-1">{m.absentReason}</p>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                    m.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : m.status === 'scheduled'
                        ? 'bg-sky-50 text-sky-700'
                        : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {MAKEUP_STATUS_LABEL[m.status]}
                </span>
              </div>
            </div>
          ))}
        </Section>
      )}

      <Section title={title}>
        {hasSessions ? (
          sessions.map((s) => {
            const status = getSessionStatusLabel(s);
            return (
              <div key={s.id} className="py-2 border-b border-slate-50 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-mono">{s.sessionDate}</span>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-700">{status.label}</span>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {formatSessionTime(s.checkInAt)} → {formatSessionTime(s.checkOutAt)}
                    </p>
                  </div>
                </div>
                {s.memo && (
                  <p className="text-[11px] text-slate-500 mt-1">메모 · {s.memo}</p>
                )}
              </div>
            );
          })
        ) : legacyRecords.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">출결 기록이 없습니다.</p>
        ) : (
          legacyRecords.map((a) => (
            <div
              key={a.id}
              className="flex justify-between items-center py-2 border-b border-slate-50 text-sm"
            >
              <span className="font-mono">{a.date}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-bold ${getAttendanceBadge(a.status).bg}`}
              >
                {getAttendanceBadge(a.status).label}
              </span>
            </div>
          ))
        )}
      </Section>
    </div>
  );
}
