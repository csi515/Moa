import { useMemo, useState, useEffect, useCallback, type FC, type FormEvent } from 'react';
import { DoorOpen, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { StudentService } from '@/core/students';
import { StorageService } from '@/services/storage';
import {
  EmptyState,
  FormField,
  FORM_CONTROL_CLASS,
  Modal,
} from '@/shared/components';
import {
  findPracticeRoomSlotConflicts,
  formatConflictSummary,
} from '@/core/academy/utils/scheduleConflicts';
import { getPracticeRoomNames } from '@/core/academy/utils/academyRooms';
import { notifyParentPracticeRoomBooked } from '@/core/academy/services/academyAlertService';
import {
  practiceRoomReservationService,
  seoulDateFromIso,
  seoulTimeFromIso,
  toSeoulIso,
  type PracticeRoomRow,
  type RoomReservationRow,
} from '@/core/customer/services/practiceRoomReservationService';

/**
 * 스태프 연습실 — canonical `room_reservations` 단일 원장.
 * 레거시 Storage/schedules(kind=practice_room) 쓰기는 하지 않는다.
 */
function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10) || 0);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function statusBadge(status: string): string {
  if (status === 'pending') return '승인 대기';
  if (status === 'approved') return '확정';
  return status;
}

export const PracticeRoomBookingView: FC = () => {
  const { showToast, openConfirmDialog } = useApp();
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [modalOpen, setModalOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('16:50');
  const [memo, setMemo] = useState('');
  const [rooms, setRooms] = useState<PracticeRoomRow[]>([]);
  const [dayBookings, setDayBookings] = useState<RoomReservationRow[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RoomReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const settings = StorageService.getSettings();
  const students = useMemo(() => StudentService.getActiveStudents(), []);
  const classes = useMemo(() => StorageService.getClasses(), []);
  const makeups = useMemo(() => StorageService.getMakeupItems(), []);
  const seedRoomNames = useMemo(
    () => getPracticeRoomNames({ settings, classes }),
    [settings, classes]
  );

  const reload = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      for (const name of seedRoomNames) {
        if (!name.trim()) continue;
        await practiceRoomReservationService.upsertRoom({
          organizationId: orgId,
          name,
        });
      }
      const [roomList, dayList, pending] = await Promise.all([
        practiceRoomReservationService.listRooms(orgId),
        practiceRoomReservationService.listByDate(orgId, selectedDate),
        practiceRoomReservationService.listPending(orgId),
      ]);
      setRooms(roomList.filter((r) => r.is_active));
      setDayBookings(dayList);
      setPendingRequests(pending);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : '연습실 데이터를 불러오지 못했습니다.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [orgId, selectedDate, seedRoomNames, showToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openCreate = () => {
    const lessonMinutes = settings.defaultLessonMinutes || 50;
    setStudentId(students[0]?.id || '');
    setRoomId(rooms[0]?.id || '');
    setStartTime('16:00');
    setEndTime(addMinutes('16:00', lessonMinutes));
    setMemo('');
    setModalOpen(true);
  };

  const persistBooking = async () => {
    if (!orgId) return;
    const student = students.find((s) => s.id === studentId);
    const room = rooms.find((r) => r.id === roomId);
    if (!student || !room) {
      showToast('원생과 연습실을 선택해 주세요.', 'warning');
      return;
    }
    if (endTime <= startTime) {
      showToast('종료 시간은 시작 시간보다 늦어야 합니다.', 'warning');
      return;
    }

    setSaving(true);
    try {
      await practiceRoomReservationService.createStaff({
        organizationId: orgId,
        roomId: room.id,
        customerId: student.id,
        startsAt: toSeoulIso(selectedDate, startTime),
        endsAt: toSeoulIso(selectedDate, endTime),
        memo: memo.trim() || undefined,
      });
      notifyParentPracticeRoomBooked(
        {
          studentId: student.id,
          studentName: student.name,
          room: room.name,
          date: selectedDate,
          startTime,
          endTime,
        },
        student.parentPhone
      );
      showToast(`${student.name} 원생 연습실이 예약되었습니다.`, 'success');
      setModalOpen(false);
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '예약 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const room = rooms.find((r) => r.id === roomId);
    const conflicts = findPracticeRoomSlotConflicts({
      classes,
      makeups,
      bookings: [], // 룸 충돌은 DB EXCLUDE가 담당
      candidate: {
        date: selectedDate,
        startTime,
        endTime,
        room: room?.name || '',
      },
    });

    if (conflicts.length > 0) {
      openConfirmDialog({
        title: '일정 충돌',
        message: `반/보강과 시간이 겹칩니다. 그래도 예약할까요?\n\n${formatConflictSummary(conflicts)}`,
        confirmText: '그래도 예약',
        cancelText: '취소',
        onConfirm: () => {
          void persistBooking();
        },
      });
      return;
    }
    void persistBooking();
  };

  const handleCancel = (row: RoomReservationRow) => {
    const name = row.customers?.name || '원생';
    const roomName = row.practice_rooms?.name || '연습실';
    openConfirmDialog({
      title: '예약 취소',
      message: `${name} · ${roomName} ${seoulTimeFromIso(row.starts_at)}–${seoulTimeFromIso(row.ends_at)} 예약을 취소할까요?`,
      confirmText: '취소하기',
      cancelText: '닫기',
      isDestructive: true,
      onConfirm: () => {
        void practiceRoomReservationService
          .cancel(row.id)
          .then(() => {
            showToast('연습실 예약을 취소했습니다.', 'success');
            return reload();
          })
          .catch((err: Error) => showToast(err.message, 'error'));
      },
    });
  };

  if (!orgId) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">조직을 선택해 주세요.</p>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {pendingRequests.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-2">
          <h3 className="text-xs font-black text-amber-900">수강생 예약 승인 대기</h3>
          {pendingRequests.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl border border-amber-100 px-3 py-2"
            >
              <div className="text-xs min-w-0">
                <p className="font-bold text-slate-900">
                  {r.customers?.name || '수강생'} · {r.practice_rooms?.name || '연습실'}
                </p>
                <p className="text-slate-500 mt-0.5 font-mono">
                  {seoulDateFromIso(r.starts_at)}{' '}
                  {seoulTimeFromIso(r.starts_at)}–{seoulTimeFromIso(r.ends_at)}
                </p>
                {r.memo && <p className="text-slate-500 mt-0.5">{r.memo}</p>}
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className="min-h-[44px] px-3 rounded-xl text-xs font-bold bg-emerald-600 text-white"
                  onClick={() => {
                    void practiceRoomReservationService
                      .review(r.id, true)
                      .then(() => {
                        showToast('예약을 승인했습니다.', 'success');
                        return reload();
                      })
                      .catch((err: Error) => showToast(err.message, 'error'));
                  }}
                >
                  승인
                </button>
                <button
                  type="button"
                  className="min-h-[44px] px-3 rounded-xl text-xs font-bold border border-rose-200 text-rose-600"
                  onClick={() => {
                    void practiceRoomReservationService
                      .review(r.id, false)
                      .then(() => {
                        showToast('예약을 거절했습니다.', 'info');
                        return reload();
                      })
                      .catch((err: Error) => showToast(err.message, 'error'));
                  }}
                >
                  거절
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="flex items-end justify-between gap-3">
        <FormField label="날짜" className="flex-1">
          <input
            type="date"
            className={FORM_CONTROL_CLASS}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </FormField>
        <button
          type="button"
          onClick={openCreate}
          disabled={rooms.length === 0}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shrink-0 mb-0.5 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          예약
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 text-center py-8">불러오는 중...</p>
      ) : dayBookings.length === 0 ? (
        <EmptyState
          icon={<DoorOpen className="w-8 h-8" />}
          title="이날 연습실 예약이 없습니다"
          description="원생 연습 시간을 예약해 보세요. 수강생 신청과 동일 원장에서 충돌이 차단됩니다."
          action={
            <button
              type="button"
              onClick={openCreate}
              disabled={rooms.length === 0}
              className="text-xs font-bold text-indigo-600 min-h-[44px]"
            >
              예약하기
            </button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {dayBookings.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white"
            >
              <div className="min-w-0">
                <p className="font-bold text-slate-900">
                  {seoulTimeFromIso(b.starts_at)}–{seoulTimeFromIso(b.ends_at)} ·{' '}
                  {b.practice_rooms?.name || '연습실'}
                </p>
                <p className="text-sm text-slate-600 mt-0.5">
                  {b.customers?.name || '원생'}
                  <span className="ml-1.5 text-[10px] font-bold text-slate-500">
                    {statusBadge(b.status)}
                  </span>
                </p>
                {b.memo && <p className="text-[11px] text-slate-400 mt-0.5">{b.memo}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleCancel(b)}
                className="shrink-0 min-h-[44px] px-3 rounded-xl text-xs font-bold text-rose-600 border border-rose-100 hover:bg-rose-50"
              >
                취소
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="연습실 예약"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-5 pb-6">
          <FormField label="원생" required>
            <select
              className={FORM_CONTROL_CLASS}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            >
              <option value="">선택</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="연습실" required>
            <select
              className={FORM_CONTROL_CLASS}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
            >
              <option value="">선택</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="시작" required>
              <input
                type="time"
                className={FORM_CONTROL_CLASS}
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setEndTime(addMinutes(e.target.value, settings.defaultLessonMinutes || 50));
                }}
                required
              />
            </FormField>
            <FormField label="종료" required>
              <input
                type="time"
                className={FORM_CONTROL_CLASS}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </FormField>
          </div>
          <FormField label="메모">
            <input
              className={FORM_CONTROL_CLASS}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="선택 사항"
            />
          </FormField>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 min-h-[48px] rounded-xl border border-slate-200 text-sm font-bold text-slate-600"
            >
              닫기
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[1.4] min-h-[48px] rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? '저장 중...' : '예약 저장'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
