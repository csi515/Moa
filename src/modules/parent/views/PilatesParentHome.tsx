import { StorageService } from '@/services/storage';
import { formatCurrency } from '@/utils/formatters';
import { ScheduleService } from '@/core/services/scheduleService';
import type { ParentPortalTab } from '@/types/education';
import type { Student } from '@/types';
import { Section, StatCard } from './shared';
import { ParentHeroCard, ParentNoticePreview } from './parentHomeShared';

function formatBookingWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16).replace('T', ' ');
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 필라테스 학부모/회원 홈 */
export function PilatesParentHome({
  student,
  onNavigate,
}: {
  student: Student;
  onNavigate: (t: ParentPortalTab) => void;
}) {
  const summary = StorageService.getStudentBillingSummary(student.id);
  const now = new Date().toISOString();
  const upcoming = ScheduleService.getBookings()
    .filter((b) => b.customerId === student.id && b.startsAt >= now && b.status !== 'cancelled')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const next = upcoming[0];

  return (
    <div className="space-y-4">
      <ParentHeroCard
        student={student}
        subtitle="필라테스"
        gradientClass="bg-gradient-to-br from-teal-600 to-cyan-800"
      />

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onNavigate('bookings')} className="text-left">
          <StatCard label="다음 예약" value={next ? formatBookingWhen(next.startsAt) : '없음'} />
        </button>
        <button type="button" onClick={() => onNavigate('tuition')} className="text-left">
          <StatCard
            label="미납액"
            value={formatCurrency(summary.grandUnpaid ?? summary.totalUnpaid)}
            warn={(summary.grandUnpaid ?? summary.totalUnpaid) > 0}
          />
        </button>
      </div>

      <Section title="다가오는 예약">
        {upcoming.length === 0 ? (
          <button
            type="button"
            onClick={() => onNavigate('bookings')}
            className="w-full text-sm text-slate-500 py-2"
          >
            예정된 예약이 없습니다
          </button>
        ) : (
          <ul className="space-y-2">
            {upcoming.slice(0, 4).map((b) => (
              <li key={b.id}>
                <button type="button" onClick={() => onNavigate('bookings')} className="w-full text-left">
                  <p className="text-sm font-bold text-slate-800">{b.serviceName || '수업'}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {formatBookingWhen(b.startsAt)}
                    {b.staffName ? ` · ${b.staffName}` : ''}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <ParentNoticePreview student={student} onNavigate={onNavigate} />
    </div>
  );
}
