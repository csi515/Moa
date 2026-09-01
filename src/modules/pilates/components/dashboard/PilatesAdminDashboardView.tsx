import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh } from '@/hooks';
import {
  DashboardEditToolbar,
  DashboardMetricGrid,
  DashboardPanelGrid,
  useDashboardWidgetVisibility,
} from '@/core/dashboard';
import { ScheduleService } from '@/core/services/scheduleService';
import { StorageService } from '@/services/storage';
import { PageHeader, SummaryMetricCard, EmptyState } from '@/shared/components';
import { formatKoreanDate } from '@/utils/formatters';
import { Activity, Calendar, Users } from 'lucide-react';
import { PilatesTodayBookingsPanel } from './PilatesTodayBookingsPanel';

export const PilatesAdminDashboardView: React.FC = () => {
  const { setActiveTab } = useApp();
  const refreshKey = useStorageRefresh();
  const isVisible = useDashboardWidgetVisibility('pilates');

  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = useMemo(
    () => ScheduleService.getBookingsByDate(today),
    [today, refreshKey]
  );
  const upcoming = useMemo(() => ScheduleService.getUpcomingBookings(5), [refreshKey]);
  const members = StorageService.getStudents().filter((s) => s.status === 'active');
  const instructors = StorageService.getTeachers().filter((t) => t.status === 'active');
  const services = ScheduleService.getActiveServiceOfferings();

  const confirmedToday = todayBookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'scheduled'
  ).length;

  return (
    <div className="space-y-6 pb-12">
      <DashboardEditToolbar />

      <PageHeader
        icon={<Activity className="w-6 h-6" />}
        iconClassName="text-teal-600"
        title="필라테스 스튜디오 대시보드"
        description={`${formatKoreanDate(today)} · 오늘의 예약과 운영 현황`}
      />

      <DashboardMetricGrid>
        {isVisible('stat_today_bookings') && (
          <SummaryMetricCard label="오늘 예약" value={`${todayBookings.length}건`} variant="teal" />
        )}
        {isVisible('stat_confirmed_bookings') && (
          <SummaryMetricCard label="확정/예약" value={`${confirmedToday}건`} variant="emerald" />
        )}
        {isVisible('stat_active_members') && (
          <SummaryMetricCard label="재적 회원" value={`${members.length}명`} />
        )}
        {isVisible('stat_service_types') && (
          <SummaryMetricCard label="수업 종류" value={`${services.length}개`} variant="purple" />
        )}
      </DashboardMetricGrid>

      <DashboardPanelGrid
        panels={[
          {
            key: 'panel_today_bookings',
            visible: isVisible('panel_today_bookings'),
            content: (
              <PilatesTodayBookingsPanel
                bookings={todayBookings}
                showStaffName
                onViewAll={() => setActiveTab('bookings')}
                onAdd={() => setActiveTab('bookings')}
              />
            ),
          },
          {
            key: 'panel_upcoming_bookings',
            visible: isVisible('panel_upcoming_bookings'),
            content: (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  다가오는 예약
                </h3>
                {upcoming.length === 0 ? (
                  <EmptyState
                    icon={<Calendar className="w-8 h-8" />}
                    title="예정된 예약이 없습니다"
                    description="다가오는 수업 예약이 여기에 표시됩니다."
                    action={
                      <button
                        type="button"
                        onClick={() => setActiveTab('bookings')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                      >
                        예약 관리
                      </button>
                    }
                    className="p-6 border-0 shadow-none bg-slate-50/50 rounded-xl"
                  />
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((booking) => (
                      <div key={booking.id} className="flex justify-between p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-sm">
                        <div>
                          <p className="font-bold text-slate-900">{booking.customerName}</p>
                          <p className="text-xs text-slate-500">{booking.serviceName}</p>
                        </div>
                        <span className="text-xs font-bold text-teal-700">
                          {booking.startsAt.slice(0, 16).replace('T', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />

      {isVisible('panel_quick_links') && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className="p-4 min-h-[72px] bg-white rounded-2xl border border-slate-200 hover:border-teal-300 text-left transition-colors"
          >
            <Users className="w-5 h-5 text-teal-600 mb-2" />
            <p className="font-bold text-sm">회원 {members.length}명</p>
            <p className="text-xs text-slate-500">회원 관리</p>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instructors')}
            className="p-4 min-h-[72px] bg-white rounded-2xl border border-slate-200 hover:border-teal-300 text-left transition-colors"
          >
            <Activity className="w-5 h-5 text-purple-600 mb-2" />
            <p className="font-bold text-sm">강사 {instructors.length}명</p>
            <p className="text-xs text-slate-500">강사 관리</p>
          </button>
        </div>
      )}
    </div>
  );
};
