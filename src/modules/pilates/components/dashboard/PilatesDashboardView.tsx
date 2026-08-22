import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh } from '@/hooks';
import { ScheduleService } from '@/core/services/scheduleService';
import { StorageService } from '@/services/storage';
import { PageHeader, SummaryMetricCard } from '@/shared/components';
import { formatKoreanDate } from '@/utils/formatters';
import { Activity, Calendar, Users, Dumbbell } from 'lucide-react';

export const PilatesDashboardView: React.FC = () => {
  const { setActiveTab } = useApp();
  const refreshKey = useStorageRefresh();

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

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Activity className="w-6 h-6" />}
        iconClassName="text-teal-600"
        title="필라테스 스튜디오 대시보드"
        description={`${formatKoreanDate(today)} · 오늘의 예약과 운영 현황`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryMetricCard label="오늘 예약" value={`${todayBookings.length}건`} variant="teal" />
        <SummaryMetricCard label="확정/예약" value={`${confirmedToday}건`} variant="emerald" />
        <SummaryMetricCard label="재적 회원" value={`${members.length}명`} />
        <SummaryMetricCard label="수업 종류" value={`${services.length}개`} variant="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <p className="text-sm text-slate-400 py-6 text-center">오늘 예약이 없습니다</p>
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

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Dumbbell className="w-4 h-4 text-purple-600" />
            다가오는 예약
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">예정된 예약이 없습니다</p>
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab('members')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-300 text-left"
        >
          <Users className="w-5 h-5 text-teal-600 mb-2" />
          <p className="font-bold text-sm">회원 {members.length}명</p>
          <p className="text-xs text-slate-500">회원 관리</p>
        </button>
        <button
          onClick={() => setActiveTab('instructors')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-300 text-left"
        >
          <Activity className="w-5 h-5 text-purple-600 mb-2" />
          <p className="font-bold text-sm">강사 {instructors.length}명</p>
          <p className="text-xs text-slate-500">강사 관리</p>
        </button>
      </div>
    </div>
  );
};
