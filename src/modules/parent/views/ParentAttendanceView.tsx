import React from 'react';
import { StorageService } from '@/services/storage';
import { getAttendanceBadge } from '@/utils/formatters';
import {
  formatSessionTime,
  getSessionStatusLabel,
} from '@/core/attendance/services/attendanceService';
import type { Student } from '@/types';
import { Section } from './shared';

export function ParentAttendanceView({ student }: { student: Student }) {
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
