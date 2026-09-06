import { useState, type FC, type FormEvent } from 'react';
import { CalendarPlus, Loader2, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { coreScheduleService } from '../services/coreScheduleService';

interface CreateConsultationScheduleModalProps {
  defaultTitle?: string;
  defaultDurationMinutes?: number;
  onClose: () => void;
  onCreated?: () => void;
}

/** 단건 상담 bookable 일정 생성 */
export const CreateConsultationScheduleModal: FC<CreateConsultationScheduleModalProps> = ({
  defaultTitle = '상담',
  defaultDurationMinutes = 30,
  onClose,
  onCreated,
}) => {
  const { showToast } = useApp();
  const { currentOrganization } = useOrganization();
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState(defaultTitle);
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('14:00');
  const [duration, setDuration] = useState(defaultDurationMinutes);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;
    if (!date || !startTime) {
      showToast('날짜와 시작 시간을 입력하세요.', 'warning');
      return;
    }

    const [h, m] = startTime.split(':').map(Number);
    const starts = new Date(
      Number(date.slice(0, 4)),
      Number(date.slice(5, 7)) - 1,
      Number(date.slice(8, 10)),
      h,
      m,
      0,
      0
    );
    const ends = new Date(starts.getTime() + duration * 60 * 1000);

    setSaving(true);
    try {
      await coreScheduleService.createSchedule(currentOrganization.id, {
        title: title.trim() || defaultTitle,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        is_bookable: true,
        max_capacity: 1,
      });
      showToast('상담 일정을 등록했습니다.', 'success');
      onCreated?.();
      onClose();
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : '일정 등록에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">상담 일정 추가</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-500">제목</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] text-sm rounded-xl border border-slate-200 bg-slate-50"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-500">날짜</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] text-sm rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-500">시작</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] text-sm rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-500">상담 시간</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2.5 min-h-[44px] text-sm rounded-xl border border-slate-200 bg-slate-50"
            >
              {[15, 20, 30, 45, 60].map((m) => (
                <option key={m} value={m}>
                  {m}분
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full min-h-[44px] mt-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold inline-flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            등록
          </button>
        </form>
      </div>
    </div>
  );
};
