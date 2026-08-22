import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh, useStudentNavigation, useStaffScope } from '@/hooks';
import { StorageService } from '@/services/storage';
import { MakeupItem, MakeupStatus } from '@/types';
import {
  EmptyState,
  FilterTabs,
  Modal,
  PageHeader,
  SummaryMetricCard,
  type FilterTabItem,
} from '@/shared/components';
import { formatPhone } from '@/utils/formatters';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
} from 'lucide-react';

const STATUS_TABS: FilterTabItem<MakeupStatus | 'all'>[] = [
  { id: 'pending', label: '미보강' },
  { id: 'scheduled', label: '예약됨' },
  { id: 'completed', label: '완료' },
  { id: 'all', label: '전체' },
];

export const MakeupManagementView: React.FC = () => {
  const { showToast } = useApp();
  const { openStudent } = useStudentNavigation();
  const refreshKey = useStorageRefresh();
  const { scopeMakeupItems } = useStaffScope();

  const [statusFilter, setStatusFilter] = useState<MakeupStatus | 'all'>('pending');
  const [scheduleTarget, setScheduleTarget] = useState<MakeupItem | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));

  const allStudents = StorageService.getStudents();
  const allItems = useMemo(
    () => scopeMakeupItems(StorageService.getMakeupItems(), allStudents),
    [allStudents, scopeMakeupItems, refreshKey]
  );

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return allItems;
    return allItems.filter((m) => m.status === statusFilter);
  }, [allItems, statusFilter, refreshKey]);

  const counts = useMemo(
    () => ({
      pending: allItems.filter((m) => m.status === 'pending').length,
      scheduled: allItems.filter((m) => m.status === 'scheduled').length,
      completed: allItems.filter((m) => m.status === 'completed').length,
    }),
    [allItems, refreshKey]
  );

  const statusTabsWithCounts = STATUS_TABS.map((tab) =>
    tab.id !== 'all' ? { ...tab, count: counts[tab.id as MakeupStatus] } : tab
  );

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTarget) return;
    StorageService.scheduleMakeup(scheduleTarget.attendanceId, scheduleDate);
    showToast(`${scheduleTarget.studentName} 원생 보강 일정이 등록되었습니다.`, 'success');
    setScheduleTarget(null);
  };

  const handleComplete = (item: MakeupItem) => {
    StorageService.completeMakeup(item.attendanceId);
    showToast(`${item.studentName} 원생 보강이 완료 처리되었습니다.`, 'success');
  };

  const statusLabel: Record<MakeupStatus, string> = {
    pending: '미보강',
    scheduled: '예약됨',
    completed: '완료',
  };

  const statusColor: Record<MakeupStatus, string> = {
    pending: 'bg-rose-100 text-rose-700',
    scheduled: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Sparkles className="w-6 h-6" />}
        iconClassName="text-purple-600"
        title="보강 수업 관리"
        description="결석 원생의 보강 일정을 등록하고 완료 처리합니다"
      />

      <div className="grid grid-cols-3 gap-3">
        <SummaryMetricCard label="미보강" value={`${counts.pending}건`} variant="rose" />
        <SummaryMetricCard label="예약됨" value={`${counts.scheduled}건`} variant="amber" />
        <SummaryMetricCard label="완료" value={`${counts.completed}건`} variant="emerald" />
      </div>

      <FilterTabs
        tabs={statusTabsWithCounts}
        active={statusFilter}
        onChange={setStatusFilter}
        activeClassName="bg-purple-600 text-white"
        inactiveClassName="bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-10 h-10" />}
          title={statusFilter === 'pending' ? '미보강 건이 없습니다' : '해당 보강 내역이 없습니다'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.attendanceId}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => openStudent(item.studentId)}
                      className="font-bold text-slate-900 hover:text-indigo-600 text-sm"
                    >
                      {item.studentName}
                    </button>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusColor[item.status]}`}>
                      {statusLabel[item.status]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.className} · 결석일 {item.originalDate}
                    {item.absentReason && ` · ${item.absentReason}`}
                  </p>
                  {item.makeUpDate && (
                    <p className="text-xs text-purple-700 font-semibold mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      보강 예정: {item.makeUpDate}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {item.parentPhone && (
                    <a
                      href={`tel:${item.parentPhone}`}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600"
                      title="전화"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  {item.status === 'pending' && (
                    <button
                      onClick={() => {
                        setScheduleTarget(item);
                        setScheduleDate(new Date().toISOString().slice(0, 10));
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      일정 등록
                    </button>
                  )}
                  {(item.status === 'pending' || item.status === 'scheduled') && (
                    <button
                      onClick={() => handleComplete(item)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      보강 완료
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(scheduleTarget)}
        onClose={() => setScheduleTarget(null)}
        title="보강 일정 등록"
        maxWidth="sm"
      >
        <form onSubmit={handleSchedule} className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            <strong>{scheduleTarget?.studentName}</strong> · 결석일 {scheduleTarget?.originalDate}
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">보강 예정일</label>
            <input
              type="date"
              required
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
          >
            등록
          </button>
        </form>
      </Modal>
    </div>
  );
};
