import type { FC } from 'react';
import { Calendar, Plus } from 'lucide-react';
import type { Booking } from '@/core/types/schedule';
import { EmptyState } from '@/shared/components';

interface PilatesTodayBookingsPanelProps {
  bookings: Booking[];
  showStaffName?: boolean;
  onViewAll: () => void;
  onAdd: () => void;
}

export const PilatesTodayBookingsPanel: FC<PilatesTodayBookingsPanelProps> = ({
  bookings,
  showStaffName = false,
  onViewAll,
  onAdd,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-slate-900 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-teal-600" />
        오늘 예약
      </h3>
      <button
        type="button"
        onClick={onViewAll}
        className="text-xs font-bold text-teal-600 hover:underline min-h-[44px] px-2"
      >
        전체 보기
      </button>
    </div>
    {bookings.length === 0 ? (
      <EmptyState
        icon={<Calendar className="w-8 h-8" />}
        title="오늘 예약이 없습니다"
        description="예약 캘린더에서 수업을 등록해 보세요."
        action={
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            예약 추가
          </button>
        }
        className="p-6 border-0 shadow-none bg-slate-50/50 rounded-xl"
      />
    ) : (
      <div className="space-y-2">
        {bookings.map((booking) => (
          <div key={booking.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
            <p className="font-bold text-slate-900">{booking.customerName}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {booking.startsAt.slice(11, 16)} · {booking.serviceName || '수업'}
              {showStaffName ? ` · ${booking.staffName || '강사 미지정'}` : ''}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
);
