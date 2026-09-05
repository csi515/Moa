import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh, useStaffScope } from '@/hooks';
import { ScheduleService } from '@/core/services/scheduleService';
import { StorageService } from '@/services/storage';
import type { Booking, BookingStatus } from '@/core/types/schedule';
import { getSlotCapacityInfo } from '@/core/schedules/bookingCapacity';
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
  const [instructorFilter, setInstructorFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [memberId, setMemberId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [formStaffId, setFormStaffId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('10:00');

  useEffect(() => {
    if (isScoped && staffId) {
      setFormStaffId(staffId);
      setInstructorFilter(staffId);
    }
  }, [isScoped, staffId]);

  const today = new Date().toISOString().slice(0, 10);
  const allBookingsRaw = ScheduleService.getBookings();
  const recruitments = ScheduleService.getSlotRecruitments();
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

  const instructorTabs: FilterTabItem<string>[] = useMemo(() => {
    const tabs: FilterTabItem<string>[] = [{ id: 'all', label: '전체 강사' }];
    for (const i of instructors) {
      tabs.push({ id: i.id, label: i.name });
    }
    return tabs;
  }, [instructors, refreshKey]);

  const filtered = useMemo(() => {
    let sorted = [...allBookings].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    if (instructorFilter !== 'all') {
      sorted = sorted.filter((b) => b.staffId === instructorFilter);
    }
    if (filter === 'today') return sorted.filter((b) => b.startsAt.startsWith(today));
    if (filter === 'upcoming') return sorted.filter((b) => b.startsAt >= new Date().toISOString());
    return sorted;
  }, [allBookings, filter, instructorFilter, today, refreshKey]);

  const resolvedFormStaffId = formStaffId || staffId || '';
  const draftStartsAt = `${date}T${time}:00`;
  const selectedService = services.find((s) => s.id === serviceId);
  const draftCapacity =
    selectedService &&
    resolvedFormStaffId &&
    getSlotCapacityInfo({
      service: selectedService,
      staffId: resolvedFormStaffId,
      startsAt: draftStartsAt,
      bookings: allBookingsRaw,
      recruitments,
    });

  const memberRemaining = memberId
    ? ScheduleService.getCustomerRemainingSessions(memberId)
    : null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find((m) => m.id === memberId);
    const service = services.find((s) => s.id === serviceId);
    const instructor = instructors.find((i) => i.id === resolvedFormStaffId);
    if (!member || !service) {
      showToast('회원과 수업 종류를 선택해 주세요.', 'warning');
      return;
    }
    if (!instructor) {
      showToast('강사를 선택해 주세요. 강사별로 예약·정원이 관리됩니다.', 'warning');
      return;
    }

    const startsAt = `${date}T${time}:00`;
    const capacity = getSlotCapacityInfo({
      service,
      staffId: instructor.id,
      startsAt,
      bookings: ScheduleService.getBookings(),
      recruitments: ScheduleService.getSlotRecruitments(),
    });
    if (capacity.isClosed) {
      showToast(
        capacity.closedManually
          ? `${instructor.name} 강사 이 시간대는 모집이 마감되었습니다.`
          : `${instructor.name} 강사 정원이 가득 찼습니다 (${capacity.occupied}/${capacity.maxCapacity}).`,
        'warning'
      );
      return;
    }

    const start = new Date(startsAt);
    const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);

    ScheduleService.saveBooking({
      customerId: member.id,
      customerName: member.name,
      staffId: instructor.id,
      staffName: instructor.name,
      serviceId: service.id,
      serviceName: service.name,
      startsAt,
      endsAt: end.toISOString(),
      status: 'scheduled',
    });

    showToast(`${instructor.name} 강사 예약이 등록되었습니다.`, 'success');
    setIsModalOpen(false);
  };

  const updateStatus = (booking: Booking, status: BookingStatus) => {
    const result = ScheduleService.updateBookingStatus(booking.id, status);
    if (!result) {
      showToast('상태 변경에 실패했습니다.', 'error');
      return;
    }
    if (status === 'completed' && !booking.sessionPassId && !result.sessionPassId) {
      showToast(`예약 상태가 '${STATUS_LABEL[status]}'(으)로 변경되었습니다. (이용권 잔여 없음)`, 'info');
      return;
    }
    showToast(`예약 상태가 '${STATUS_LABEL[status]}'(으)로 변경되었습니다.`, 'info');
  };

  const toggleRecruitment = (booking: Booking) => {
    if (!booking.serviceId || !booking.staffId) {
      showToast('강사가 지정된 예약만 모집 마감할 수 있습니다.', 'warning');
      return;
    }
    const service =
      services.find((s) => s.id === booking.serviceId) ??
      ScheduleService.getServiceOfferings().find((s) => s.id === booking.serviceId);
    if (!service) return;
    const info = getSlotCapacityInfo({
      service,
      staffId: booking.staffId,
      startsAt: booking.startsAt,
      bookings: allBookingsRaw,
      recruitments,
    });
    ScheduleService.setSlotRecruitmentClosed(
      booking.serviceId,
      booking.staffId,
      booking.startsAt,
      !info.closedManually
    );
    showToast(
      !info.closedManually
        ? `${booking.staffName || '강사'} 시간대 모집을 마감했습니다.`
        : '모집을 다시 열었습니다.',
      'success'
    );
  };

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        icon={<span className="text-xl">📅</span>}
        iconClassName="text-teal-600"
        title="예약 캘린더"
        description="강사별로 같은 시간이라도 따로 예약·정원·모집 마감됩니다"
        actions={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl min-h-[44px]"
          >
            + 예약 등록
          </button>
        }
      />

      {!isScoped && instructors.length > 0 && (
        <FilterTabs
          tabs={instructorTabs}
          active={instructorFilter}
          onChange={setInstructorFilter}
          activeClassName="bg-teal-600 text-white"
        />
      )}

      <FilterTabs tabs={FILTERS} active={filter} onChange={setFilter} activeClassName="bg-teal-600 text-white" />

      {filtered.length === 0 ? (
        <EmptyState icon={<span className="text-3xl">📭</span>} title="예약 내역이 없습니다" />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const service =
              services.find((s) => s.id === b.serviceId) ??
              ScheduleService.getServiceOfferings().find((s) => s.id === b.serviceId);
            const capacity =
              service && b.serviceId
                ? getSlotCapacityInfo({
                    service,
                    staffId: b.staffId,
                    startsAt: b.startsAt,
                    bookings: allBookingsRaw,
                    recruitments,
                  })
                : null;

            return (
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
                    {capacity && (
                      <p
                        className={`text-[11px] font-bold mt-1 ${
                          capacity.isClosed ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        {b.staffName ? `${b.staffName} · ` : ''}
                        정원 {capacity.occupied}/{capacity.maxCapacity}
                        {capacity.isClosed
                          ? capacity.closedManually
                            ? ' · 모집 마감'
                            : ' · 정원 마감'
                          : ` · 잔여 ${capacity.remaining}자리`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {STATUS_LABEL[b.status]}
                    </span>
                    {b.serviceId && b.staffId && capacity && (
                      <button
                        type="button"
                        onClick={() => toggleRecruitment(b)}
                        className="px-2 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg min-h-[44px]"
                      >
                        {capacity.closedManually ? '모집 재개' : '모집 마감'}
                      </button>
                    )}
                    {b.status === 'scheduled' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(b, 'confirmed')}
                        className="px-2 py-1 text-xs font-bold bg-teal-600 text-white rounded-lg min-h-[44px]"
                      >
                        확정
                      </button>
                    )}
                    {(b.status === 'scheduled' || b.status === 'confirmed') && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateStatus(b, 'completed')}
                          className="px-2 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg min-h-[44px]"
                        >
                          완료
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(b, 'cancelled')}
                          className="px-2 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-lg min-h-[44px]"
                        >
                          취소
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="새 예약 등록">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">강사 *</label>
            {isScoped ? (
              <p className="text-sm text-slate-700 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[44px] flex items-center">
                {instructors.find((i) => i.id === formStaffId)?.name || '본인'}
              </p>
            ) : (
              <select
                required
                value={formStaffId}
                onChange={(e) => setFormStaffId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl min-h-[44px]"
              >
                <option value="">선택</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-slate-500 mt-1">강사마다 같은 시간도 따로 모집·정원 관리됩니다</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">회원 *</label>
            <select
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl min-h-[44px]"
            >
              <option value="">선택</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {` (잔여 ${ScheduleService.getCustomerRemainingSessions(m.id)}회)`}
                </option>
              ))}
            </select>
            {memberRemaining !== null && (
              <p className="text-[11px] text-slate-500 mt-1">선택 회원 이용권 잔여 {memberRemaining}회</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">수업 종류 *</label>
            <select
              required
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl min-h-[44px]"
            >
              <option value="">선택</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMinutes}분 · 정원 {s.maxCapacity})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">날짜 *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">시간 *</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl min-h-[44px]"
              />
            </div>
          </div>
          {draftCapacity && (
            <p
              className={`text-xs font-bold ${
                draftCapacity.isClosed ? 'text-rose-600' : 'text-teal-700'
              }`}
            >
              {instructors.find((i) => i.id === resolvedFormStaffId)?.name || '강사'} 슬롯{' '}
              {draftCapacity.occupied}/{draftCapacity.maxCapacity}명
              {draftCapacity.isClosed
                ? draftCapacity.closedManually
                  ? ' · 모집 마감'
                  : ' · 정원 마감 (등록 불가)'
                : ` · 잔여 ${draftCapacity.remaining}자리`}
            </p>
          )}
          {!resolvedFormStaffId && (
            <p className="text-xs font-bold text-amber-600">강사를 선택하면 해당 강사 정원을 확인할 수 있습니다</p>
          )}
          <button
            type="submit"
            disabled={Boolean(draftCapacity?.isClosed) || !resolvedFormStaffId}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm min-h-[44px]"
          >
            등록
          </button>
        </form>
      </Modal>
    </div>
  );
};
