import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh, useStaffScope } from '@/hooks';
import { ScheduleService } from '@/core/services/scheduleService';
import { StorageService } from '@/services/storage';
import type { Booking, BookingStatus } from '@/core/types/schedule';
import { EmptyState, FilterTabs, Modal, PageHeader, type FilterTabItem } from '@/shared/components';

type BookingFilter = 'today' | 'upcoming' | 'all';

const FILTERS: FilterTabItem<BookingFilter>[] = [
  { id: 'today', label: '오늘' },
  { id: 'upcoming', label: '예정' },
  { id: 'all', label: '전체' },
];

const STATUS_LABEL: Record<BookingStatus, string> = {
  scheduled: '예약됨',
  confirmed: '확정',
  completed: '완료',
  cancelled: '취소',
  no_show: '노쇼',
};

export const BookingCalendarView: React.FC = () => {
  const { showToast } = useApp();
  const refreshKey = useStorageRefresh();
  const { isScoped, staffId, scopeBookings, scopeMembersForPilates } = useStaffScope();
  const [filter, setFilter] = useState<BookingFilter>('today');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [memberId, setMemberId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [formStaffId, setFormStaffId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('10:00');

  useEffect(() => {
    if (isScoped && staffId) setFormStaffId(staffId);
  }, [isScoped, staffId]);

  const today = new Date().toISOString().slice(0, 10);
  const allBookingsRaw = ScheduleService.getBookings();
  const allBookings = useMemo(
    () => scopeBookings(allBookingsRaw),
    [allBookingsRaw, scopeBookings, refreshKey]
  );
  const members = useMemo(
    () =>
      scopeMembersForPilates(
        StorageService.getStudents().filter((s) => s.status === 'active'),
        allBookingsRaw
      ),
    [allBookingsRaw, scopeMembersForPilates, refreshKey]
  );
  const instructors = StorageService.getTeachers().filter((t) => t.status === 'active');
  const services = ScheduleService.getActiveServiceOfferings();

  const filtered = useMemo(() => {
    const sorted = [...allBookings].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    if (filter === 'today') return sorted.filter((b) => b.startsAt.startsWith(today));
    if (filter === 'upcoming') return sorted.filter((b) => b.startsAt >= new Date().toISOString());
    return sorted;
  }, [allBookings, filter, today, refreshKey]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find((m) => m.id === memberId);
    const service = services.find((s) => s.id === serviceId);
    const instructor = instructors.find((i) => i.id === (formStaffId || staffId));
    if (!member || !service) {
      showToast('회원과 수업 종류를 선택해 주세요.', 'warning');
      return;
    }

    const startsAt = `${date}T${time}:00`;
    const start = new Date(startsAt);
    const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);

    ScheduleService.saveBooking({
      customerId: member.id,
      customerName: member.name,
      staffId: instructor?.id,
      staffName: instructor?.name,
      serviceId: service.id,
      serviceName: service.name,
      startsAt: startsAt,
      endsAt: end.toISOString(),
      status: 'scheduled',
    });

    showToast('예약이 등록되었습니다.', 'success');
    setIsModalOpen(false);
  };

  const updateStatus = (booking: Booking, status: BookingStatus) => {
    ScheduleService.updateBookingStatus(booking.id, status);
    showToast(`예약 상태가 '${STATUS_LABEL[status]}'(으)로 변경되었습니다.`, 'info');
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<span className="text-xl">📅</span>}
        iconClassName="text-teal-600"
        title="예약 캘린더"
        description="회원별 수업 예약을 등록하고 상태를 관리합니다"
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl"
          >
            + 예약 등록
          </button>
        }
      />

      <FilterTabs tabs={FILTERS} active={filter} onChange={setFilter} activeClassName="bg-teal-600 text-white" />

      {filtered.length === 0 ? (
        <EmptyState icon={<span className="text-3xl">📭</span>} title="예약 내역이 없습니다" />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{b.customerName}</p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {b.serviceName} · {b.staffName || '강사 미지정'}
                  </p>
                  <p className="text-xs text-teal-700 font-semibold mt-1">
                    {b.startsAt.slice(0, 16).replace('T', ' ')} ~ {b.endsAt.slice(11, 16)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                    {STATUS_LABEL[b.status]}
                  </span>
                  {b.status === 'scheduled' && (
                    <button
                      onClick={() => updateStatus(b, 'confirmed')}
                      className="px-2 py-1 text-xs font-bold bg-teal-600 text-white rounded-lg"
                    >
                      확정
                    </button>
                  )}
                  {(b.status === 'scheduled' || b.status === 'confirmed') && (
                    <>
                      <button
                        onClick={() => updateStatus(b, 'completed')}
                        className="px-2 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg"
                      >
                        완료
                      </button>
                      <button
                        onClick={() => updateStatus(b, 'cancelled')}
                        className="px-2 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-lg"
                      >
                        취소
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="새 예약 등록">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">회원 *</label>
            <select
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            >
              <option value="">선택</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">수업 종류 *</label>
            <select
              required
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            >
              <option value="">선택</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.durationMinutes}분)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">강사</label>
            {isScoped ? (
              <p className="text-sm text-slate-700 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                {instructors.find((i) => i.id === formStaffId)?.name || '본인'}
              </p>
            ) : (
            <select
              value={formStaffId}
              onChange={(e) => setFormStaffId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            >
              <option value="">미지정</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">날짜 *</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">시간 *</label>
              <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl" />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm">
            등록
          </button>
        </form>
      </Modal>
    </div>
  );
};
