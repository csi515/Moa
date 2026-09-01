import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh, useStaffScope } from '@/hooks';
import { usePermissions } from '@/core/auth/usePermissions';
import { DashboardEditToolbar, isDashboardWidgetVisible } from '@/core/dashboard';
import { ScheduleService } from '@/core/services/scheduleService';
import { StorageService } from '@/services/storage';
import { PageHeader, SummaryMetricCard, EmptyState } from '@/shared/components';
import { formatKoreanDate } from '@/utils/formatters';
import { Activity, Calendar, Users, Dumbbell, Plus } from 'lucide-react';

/** 필라테스 강사 전용 축소 대시보드 */
const PilatesStaffDashboard: React.FC = () => {
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
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              오늘 예약
            </h3>
            <button onClick={() => setActiveTab('bookings')} className="text-xs font-bold text-teal-600 hover:underline">
              전체 보기
            </button>
          </div>
          {todayBookings.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-8 h-8" />}
              title="오늘 예약이 없습니다"
              description="예약 캘린더에서 수업을 등록해 보세요."
              action={
                <button
                  type="button"
                  onClick={() => setActiveTab('bookings')}
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
              {todayBookings.map((b) => (
                <div key={b.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                  <p className="font-bold text-slate-900">{b.customerName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {b.startsAt.slice(11, 16)} · {b.serviceName || '수업'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

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

const PilatesAdminDashboard: React.FC = () => {
  const { setActiveTab } = useApp();
  const { settings } = usePermissions();
  const refreshKey = useStorageRefresh();

  const isVisible = useMemo(
    () => (id: string) => isDashboardWidgetVisible(id, settings, 'pilates'),
    [settings]
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = useMemo(
    () => ScheduleService.getBookingsByDate(today),
    [today, refreshKey]
  );
  const upcoming = useMemo(() => ScheduleService.getUpcomingBookings(5), [refreshKey]);
  const members = StorageService.getStudents().filter((s) => s.status === 'active');
  const instructors = StorageService.getTeachers().filter((t) => t.status === 'active');
  const services = ScheduleService.getActiveServiceOfferings();

  const confirmedToday = todayBookings.filter((b) => b.status === 'confirmed' || b.status === 'scheduled').length;

  const metricCards = [
    isVisible('stat_today_bookings') && (
      <SummaryMetricCard key="stat_today_bookings" label="오늘 예약" value={`${todayBookings.length}건`} variant="teal" />
    ),
    isVisible('stat_confirmed_bookings') && (
      <SummaryMetricCard key="stat_confirmed_bookings" label="확정/예약" value={`${confirmedToday}건`} variant="emerald" />
    ),
    isVisible('stat_active_members') && (
      <SummaryMetricCard key="stat_active_members" label="재적 회원" value={`${members.length}명`} />
    ),
    isVisible('stat_service_types') && (
      <SummaryMetricCard key="stat_service_types" label="수업 종류" value={`${services.length}개`} variant="purple" />
    ),
  ].filter(Boolean);

  const showTodayBookings = isVisible('panel_today_bookings');
  const showUpcomingBookings = isVisible('panel_upcoming_bookings');
  const showQuickLinks = isVisible('panel_quick_links');

  return (
    <div className="space-y-6 pb-12">
      <DashboardEditToolbar />

      <PageHeader
        icon={<Activity className="w-6 h-6" />}
        iconClassName="text-teal-600"
        title="필라테스 스튜디오 대시보드"
        description={`${formatKoreanDate(today)} · 오늘의 예약과 운영 현황`}
      />

      {metricCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{metricCards}</div>
      )}

      {(showTodayBookings || showUpcomingBookings) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {showTodayBookings && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  오늘 예약
                </h3>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs font-bold text-teal-600 hover:underline"
                >
                  전체 보기
                </button>
              </div>
              {todayBookings.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="w-8 h-8" />}
                  title="오늘 예약이 없습니다"
                  description="예약 캘린더에서 수업을 등록해 보세요."
                  action={
                    <button
                      type="button"
                      onClick={() => setActiveTab('bookings')}
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
                  {todayBookings.map((b) => (
                    <div key={b.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                      <p className="font-bold text-slate-900">{b.customerName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {b.startsAt.slice(11, 16)} · {b.serviceName || '수업'} · {b.staffName || '강사 미지정'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showUpcomingBookings && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Dumbbell className="w-4 h-4 text-purple-600" />
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
                  {upcoming.map((b) => (
                    <div key={b.id} className="flex justify-between p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-sm">
                      <div>
                        <p className="font-bold text-slate-900">{b.customerName}</p>
                        <p className="text-xs text-slate-500">{b.serviceName}</p>
                      </div>
                      <span className="text-xs font-bold text-teal-700">{b.startsAt.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showQuickLinks && (
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

export const PilatesDashboardView: React.FC = () => {
  const { isStaff } = usePermissions();
  return isStaff ? <PilatesStaffDashboard /> : <PilatesAdminDashboard />;
};
