import React, { useMemo } from 'react';
import { Calendar, Ticket } from 'lucide-react';
import { ScheduleService } from '@/core/services/scheduleService';
import { useStorageRefresh } from '@/hooks';
import type { Student } from '@/types';
import { EmptyState } from '@/shared/components';
import { getPassRemaining, isPassUsable } from '@/core/schedules/sessionPassUtils';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16).replace('T', ' ');
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 필라테스 회원 — 내 예약 + 이용권 잔여 */
export const PilatesParentBookingsView: React.FC<{ student: Student }> = ({ student }) => {
  const refreshKey = useStorageRefresh();
  const now = new Date().toISOString();

  const remaining = useMemo(
    () => ScheduleService.getCustomerRemainingSessions(student.id),
    [student.id, refreshKey]
  );

  const passes = useMemo(
    () =>
      ScheduleService.getCustomerSessionPasses(student.id).filter(
        (p) => p.status !== 'cancelled'
      ),
    [student.id, refreshKey]
  );

  const bookings = useMemo(
    () =>
      ScheduleService.getBookings()
        .filter((b) => b.customerId === student.id && b.status !== 'cancelled')
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    [student.id, refreshKey]
  );

  const upcoming = bookings.filter((b) => b.startsAt >= now);
  const past = bookings.filter((b) => b.startsAt < now);

  return (
    <div className="space-y-4 pb-8">
      <div className="bg-gradient-to-br from-teal-600 to-cyan-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 text-teal-100 text-xs font-bold">
          <Ticket className="w-4 h-4" />
          이용권 잔여
        </div>
        <p className="text-3xl font-black mt-1">{remaining}회</p>
        <p className="text-xs text-teal-100 mt-1">수업 완료 시 자동으로 1회 차감됩니다</p>
      </div>

      {passes.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-slate-800">보유 이용권</h3>
          {passes.map((pass) => (
            <div
              key={pass.id}
              className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between gap-2"
            >
              <div>
                <p className="text-sm font-bold text-slate-800">{pass.label}</p>
                <p className="text-[11px] text-slate-500">
                  {isPassUsable(pass) ? '사용 가능' : pass.status === 'exhausted' ? '소진' : '만료/불가'}
                  {pass.expiresAt ? ` · ~${pass.expiresAt.slice(0, 10)}` : ''}
                </p>
              </div>
              <p className="text-sm font-black text-teal-700 shrink-0">
                {getPassRemaining(pass)}/{pass.totalSessions}
              </p>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-teal-600" />
          다가오는 예약
        </h3>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-8 h-8" />}
            title="예정된 예약이 없습니다"
            className="!p-6"
          />
        ) : (
          upcoming.map((b) => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-3">
              <p className="text-sm font-bold text-slate-800">{b.serviceName || '수업'}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                {formatWhen(b.startsAt)}
                {b.staffName ? ` · ${b.staffName}` : ''}
              </p>
            </div>
          ))
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-slate-500">지난 예약</h3>
          {past.slice(0, 8).map((b) => (
            <div key={b.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-sm font-medium text-slate-700">{b.serviceName || '수업'}</p>
              <p className="text-[11px] text-slate-400 font-mono">
                {formatWhen(b.startsAt)} · {b.status}
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
