import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh, useStaffScope } from '@/hooks';
import { ScheduleService } from '@/core/services/scheduleService';
import { StorageService } from '@/services/storage';
import { PageHeader, SummaryMetricCard, EmptyState } from '@/shared/components';
import { formatKoreanDate } from '@/utils/formatters';
import { Activity, Calendar, Users } from 'lucide-react';
import { PilatesTodayBookingsPanel } from './PilatesTodayBookingsPanel';

/** 필라테스 강사 전용 축소 대시보드 */
export const PilatesStaffDashboardView: React.FC = () => {
  const { setActiveTab } = useApp();
  const refreshKey = useStorageRefresh();
  const { scopeBookings, scopeMembersForPilates } = useStaffScope();

  const today = new Date().toISOString().slice(0, 10);
  const allBookingsRaw = ScheduleService.getBookings();
  const todayBookings = useMemo(
    () => scopeBookings(ScheduleService.getBookingsByDate(today)),
    [today, scopeBookings, refreshKey]
  );
  const upcoming = useMemo(
    () => scopeBookings(ScheduleService.getUpcomingBookings(5)),
    [scopeBookings, refreshKey]
  );
  const members = useMemo(
    () =>
      scopeMembersForPilates(
        StorageService.getStudents().filter((s) => s.status === 'active'),
        allBookingsRaw
      ),
    [allBookingsRaw, scopeMembersForPilates, refreshKey]
  );

  const confirmedToday = todayBookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'scheduled'
  ).length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Activity className="w-6 h-6" />}
        iconClassName="text-teal-600"
        title="강사 대시보드"
        description={`${formatKoreanDate(today)} · 내 예약과 담당 회원`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SummaryMetricCard label="오늘 예약" value={`${todayBookings.length}건`} variant="teal" />
        <SummaryMetricCard label="확정/예약" value={`${confirmedToday}건`} variant="emerald" />
        <SummaryMetricCard label="담당 회원" value={`${members.length}명`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PilatesTodayBookingsPanel
          bookings={todayBookings}
          onViewAll={() => setActiveTab('bookings')}
          onAdd={() => setActiveTab('bookings')}
        />

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-teal-600" />
            담당 회원
          </h3>
          {members.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="담당 회원이 없습니다"
              description="예약이 연결되면 담당 회원이 표시됩니다."
              className="p-6 border-0 shadow-none bg-slate-50/50 rounded-xl"
            />
          ) : (
            <div className="space-y-2">
              {members.slice(0, 6).map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-sm font-bold text-slate-900">
                  {m.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-3">다가오는 예약</h3>
          <div className="space-y-2">
            {upcoming.map((b) => (
              <div key={b.id} className="flex justify-between p-3 rounded-xl bg-slate-50 text-sm">
                <span className="font-bold">{b.customerName}</span>
                <span className="text-xs text-teal-700">{b.startsAt.slice(0, 16).replace('T', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
