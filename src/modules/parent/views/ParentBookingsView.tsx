import { useMemo } from 'react';
import { ScheduleService } from '@/core/services/scheduleService';
import type { BookingStatus } from '@/core/types/schedule';
import type { Student } from '@/types';
import { Section } from './shared';

const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  scheduled: '예약됨',
  confirmed: '확정',
  completed: '완료',
  cancelled: '취소',
  no_show: '미방문',
};

function formatBookingWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16).replace('T', ' ');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function statusTone(status: BookingStatus): string {
  if (status === 'cancelled' || status === 'no_show') return 'bg-slate-100 text-slate-500';
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'confirmed') return 'bg-sky-50 text-sky-700';
  return 'bg-amber-50 text-amber-800';
}

/** 필라테스 회원 예약 목록 (조회 전용) */
export function ParentBookingsView({ student }: { student: Student }) {
  const now = new Date().toISOString();
  const bookings = useMemo(
    () =>
      ScheduleService.getBookings()
        .filter((b) => b.customerId === student.id)
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    [student.id]
  );

  const upcoming = bookings.filter((b) => b.startsAt >= now && b.status !== 'cancelled');
  const past = bookings.filter((b) => b.startsAt < now || b.status === 'cancelled').slice(0, 20);

  return (
    <div className="space-y-4">
      <Section title="다가오는 예약">
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            예정된 예약이 없습니다. 스튜디오에 문의해 주세요.
          </p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((b) => (
              <li key={b.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-sm text-slate-900">
                    {b.serviceName || '수업'}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${statusTone(b.status)}`}>
                    {BOOKING_STATUS_LABEL[b.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 font-mono">
                  {formatBookingWhen(b.startsAt)}
                  {b.endsAt ? ` – ${formatBookingWhen(b.endsAt).slice(11)}` : ''}
                </p>
                {b.staffName && (
                  <p className="text-[11px] text-slate-500 mt-1">강사 · {b.staffName}</p>
                )}
                {b.memo && <p className="text-[11px] text-slate-400 mt-2">{b.memo}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {past.length > 0 && (
        <Section title="지난 예약">
          <ul className="space-y-2">
            {past.map((b) => (
              <li key={b.id} className="flex justify-between items-center py-2 border-b border-slate-50 text-sm gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{b.serviceName || '수업'}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{formatBookingWhen(b.startsAt)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${statusTone(b.status)}`}>
                  {BOOKING_STATUS_LABEL[b.status]}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
