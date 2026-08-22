import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { MakeupItem, MakeupStatus } from '@/types';
import { formatPhone } from '@/utils/formatters';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  X,
} from 'lucide-react';

const STATUS_TABS: { id: MakeupStatus | 'all'; label: string }[] = [
  { id: 'pending', label: '미보강' },
  { id: 'scheduled', label: '예약됨' },
  { id: 'completed', label: '완료' },
  { id: 'all', label: '전체' },
];

export const MakeupManagementView: React.FC = () => {
  const { showToast, setSelectedStudentId, setActiveTab } = useApp();
  const [statusFilter, setStatusFilter] = useState<MakeupStatus | 'all'>('pending');
  const [scheduleTarget, setScheduleTarget] = useState<MakeupItem | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsub = StorageService.subscribe(() => setRefreshKey((k) => k + 1));
    return unsub;
  }, []);

  const allItems = StorageService.getMakeupItems();

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return allItems;
    return allItems.filter((m) => m.status === statusFilter);
  }, [allItems, statusFilter, refreshKey]);

  const counts = useMemo(() => ({
    pending: allItems.filter((m) => m.status === 'pending').length,
    scheduled: allItems.filter((m) => m.status === 'scheduled').length,
    completed: allItems.filter((m) => m.status === 'completed').length,
  }), [allItems, refreshKey]);

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
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          보강 수업 관리
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          결석 원생의 보강 일정을 등록하고 완료 처리합니다
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200">
          <p className="text-xs text-rose-700 font-semibold">미보강</p>
          <p className="text-2xl font-black text-rose-900">{counts.pending}건</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
          <p className="text-xs text-amber-700 font-semibold">예약됨</p>
          <p className="text-2xl font-black text-amber-900">{counts.scheduled}건</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
          <p className="text-xs text-emerald-700 font-semibold">완료</p>
          <p className="text-2xl font-black text-emerald-900">{counts.completed}건</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
              statusFilter === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            {tab.id !== 'all' && ` (${counts[tab.id as MakeupStatus]})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="font-bold text-slate-600">
            {statusFilter === 'pending' ? '미보강 건이 없습니다' : '해당 보강 내역이 없습니다'}
          </p>
        </div>
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
                      onClick={() => {
                        setSelectedStudentId(item.studentId);
                        setActiveTab('students');
                      }}
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

      {scheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">보강 일정 등록</h3>
              <button onClick={() => setScheduleTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSchedule} className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                <strong>{scheduleTarget.studentName}</strong> · 결석일 {scheduleTarget.originalDate}
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
          </div>
        </div>
      )}
    </div>
  );
};
