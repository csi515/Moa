import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh } from '@/hooks';
import { ScheduleService } from '@/core/services/scheduleService';
import { StorageService } from '@/services/storage';
import { CareProgramService } from '@/modules/skincare/services/careProgramService';
import { PageHeader, SummaryMetricCard } from '@/shared/components';
import { formatKoreanDate } from '@/utils/formatters';
import { Calendar, Sparkles, Users, Ticket } from 'lucide-react';

export const SkincareDashboardView: React.FC = () => {
  const { setActiveTab } = useApp();
  const refreshKey = useStorageRefresh();

  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = useMemo(
    () => ScheduleService.getBookingsByDate(today),
    [today, refreshKey]
  );
  const upcoming = useMemo(() => ScheduleService.getUpcomingBookings(5), [refreshKey]);
  const customers = StorageService.getStudents().filter((s) => s.status === 'active');
  const services = ScheduleService.getActiveServiceOfferings();
  const activePrograms = CareProgramService.getActiveEnrollments();

  const confirmedToday = todayBookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'scheduled'
  ).length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Sparkles className="w-6 h-6" />}
        iconClassName="text-rose-600"
        title="피부관리샵 대시보드"
        description={`${formatKoreanDate(today)} · 오늘의 예약과 고객 케어 현황`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryMetricCard label="오늘 예약" value={`${todayBookings.length}건`} variant="rose" />
        <SummaryMetricCard label="확정/예약" value={`${confirmedToday}건`} variant="emerald" />
        <SummaryMetricCard label="활성 고객" value={`${customers.length}명`} />
        <SummaryMetricCard
          label="진행중 프로그램"
          value={`${activePrograms.length}건`}
          variant="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-600" />
              오늘 예약
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className="text-xs font-bold text-rose-600 hover:underline"
            >
              전체 보기
            </button>
          </div>
          {todayBookings.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">오늘 예약이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {todayBookings.map((b) => (
                <div key={b.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                  <p className="font-bold text-slate-900">{b.customerName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {b.startsAt.slice(11, 16)} · {b.serviceName || '시술'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Ticket className="w-4 h-4 text-purple-600" />
            다가오는 예약
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">예정된 예약이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((b) => (
                <div
                  key={b.id}
                  className="flex justify-between p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-sm"
                >
                  <div>
                    <p className="font-bold text-slate-900">{b.customerName}</p>
                    <p className="text-xs text-slate-500">{b.serviceName}</p>
                  </div>
                  <span className="text-xs font-bold text-rose-700">
                    {b.startsAt.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-rose-300 text-left min-h-[44px]"
        >
          <Users className="w-5 h-5 text-rose-600 mb-2" />
          <p className="font-bold text-sm">고객 {customers.length}명</p>
          <p className="text-xs text-slate-500">고객 관리</p>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-rose-300 text-left min-h-[44px]"
        >
          <Sparkles className="w-5 h-5 text-purple-600 mb-2" />
          <p className="font-bold text-sm">시술 {services.length}개</p>
          <p className="text-xs text-slate-500">시술 메뉴</p>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('care-programs')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-rose-300 text-left min-h-[44px]"
        >
          <Ticket className="w-5 h-5 text-indigo-600 mb-2" />
          <p className="font-bold text-sm">프로그램 {activePrograms.length}건</p>
          <p className="text-xs text-slate-500">케어 프로그램</p>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('consultations')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-rose-300 text-left min-h-[44px]"
        >
          <Calendar className="w-5 h-5 text-emerald-600 mb-2" />
          <p className="font-bold text-sm">상담 기록</p>
          <p className="text-xs text-slate-500">피부/상담 일지</p>
        </button>
      </div>
    </div>
  );
};
