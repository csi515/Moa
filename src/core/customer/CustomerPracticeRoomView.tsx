import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  practiceRoomReservationService,
  type PracticeRoomRow,
  type RoomReservationRow,
  toSeoulIso,
} from './services/practiceRoomReservationService';

function statusLabel(status: string): string {
  if (status === 'pending') return '승인 대기';
  if (status === 'approved') return '승인됨';
  if (status === 'cancelled') return '취소됨';
  if (status === 'rejected') return '거절됨';
  if (status === 'completed') return '완료';
  return status;
}

/** 성인 수강생 — 연습실 타임슬롯 신청 */
export function CustomerPracticeRoomView({ organizationId }: { organizationId: string }) {
  const [rooms, setRooms] = useState<PracticeRoomRow[]>([]);
  const [mine, setMine] = useState<RoomReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [roomId, setRoomId] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === roomId) || rooms[0],
    [rooms, roomId]
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, m] = await Promise.all([
        practiceRoomReservationService.listRooms(organizationId),
        practiceRoomReservationService.listMyReservations(organizationId),
      ]);
      setRooms(r.filter((x) => x.is_active));
      setMine(m);
      if (!roomId && r[0]) setRoomId(r[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, [organizationId, roomId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    if (endTime <= startTime) {
      setError('종료 시간은 시작 시간보다 늦어야 합니다. (자정 넘김 불가)');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await practiceRoomReservationService.request({
        organizationId,
        roomId: selectedRoom.id,
        startsAt: toSeoulIso(date, startTime),
        endsAt: toSeoulIso(date, endTime),
        memo,
      });
      setMemo('');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '신청 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await practiceRoomReservationService.cancel(id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '취소 실패');
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-400 text-center py-8">연습실 불러오는 중...</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {rooms.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8 bg-white rounded-2xl border border-slate-200">
          등록된 연습실이 없습니다. 학원에 문의해 주세요.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
        >
          <h2 className="text-sm font-black text-slate-900">연습실 예약 신청</h2>
          <label className="block text-xs font-semibold text-slate-700">
            연습실
            <select
              value={selectedRoom?.id || ''}
              onChange={(e) => setRoomId(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold min-h-[44px]"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({String(r.open_time).slice(0, 5)}–{String(r.close_time).slice(0, 5)})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            날짜
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs min-h-[44px]"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold text-slate-700">
              시작
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs min-h-[44px]"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              종료
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs min-h-[44px]"
              />
            </label>
          </div>
          <input
            type="text"
            placeholder="메모 (선택)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs min-h-[44px]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[44px] rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:bg-slate-300"
          >
            {submitting ? '신청 중...' : '예약 신청'}
          </button>
        </form>
      )}

      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
        <h2 className="text-sm font-black text-slate-900">내 예약</h2>
        {mine.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">예약 내역이 없습니다.</p>
        ) : (
          mine.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-2 py-2 border-b border-slate-50 text-sm"
            >
              <div>
                <p className="font-bold text-slate-800">
                  {r.practice_rooms?.name || '연습실'} · {statusLabel(r.status)}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {r.starts_at.slice(0, 16).replace('T', ' ')} ~ {r.ends_at.slice(11, 16)}
                </p>
              </div>
              {(r.status === 'pending' || r.status === 'approved') && (
                <button
                  type="button"
                  onClick={() => void handleCancel(r.id)}
                  className="text-xs font-bold text-rose-600 min-h-[44px] px-2"
                >
                  취소
                </button>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
