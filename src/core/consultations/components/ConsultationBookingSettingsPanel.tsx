import React, { useMemo, useState } from 'react';
import { Save, Settings2 } from 'lucide-react';
import type { ConsultationBookingSettings, ConsultationDayAvailability } from '../types';
import { DEFAULT_CONSULTATION_BOOKING_SETTINGS } from '../types';
import type { DayOfWeek } from '@/types';

interface Props {
  settings: ConsultationBookingSettings;
  onSave: (settings: ConsultationBookingSettings) => void;
}

const DAY_ORDER: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일'];

/** 상담 가능 시간 설정 패널 */
export const ConsultationBookingSettingsPanel: React.FC<Props> = ({ settings, onSave }) => {
  const [draft, setDraft] = useState<ConsultationBookingSettings>(settings);
  const [blockedDateInput, setBlockedDateInput] = useState('');

  const sortedAvailability = useMemo(() => {
    const map = new Map(draft.weeklyAvailability.map((d) => [d.dayOfWeek, d]));
    return DAY_ORDER.map(
      (day) => map.get(day) ?? DEFAULT_CONSULTATION_BOOKING_SETTINGS.weeklyAvailability.find((d) => d.dayOfWeek === day)!
    );
  }, [draft.weeklyAvailability]);

  const updateDay = (dayOfWeek: DayOfWeek, patch: Partial<ConsultationDayAvailability>) => {
    setDraft((prev) => ({
      ...prev,
      weeklyAvailability: prev.weeklyAvailability.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d
      ),
    }));
  };

  const addBlockedDate = () => {
    if (!blockedDateInput || draft.blockedDates.includes(blockedDateInput)) return;
    setDraft((prev) => ({
      ...prev,
      blockedDates: [...prev.blockedDates, blockedDateInput].sort(),
    }));
    setBlockedDateInput('');
  };

  return (
    <div className="space-y-6">
      <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(e) => setDraft((prev) => ({ ...prev, enabled: e.target.checked }))}
          className="w-5 h-5 rounded border-slate-300 text-indigo-600"
        />
        <span className="font-bold text-slate-800">QR 상담 예약 접수 활성화</span>
      </label>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">안내 문구</label>
        <textarea
          value={draft.welcomeMessage}
          onChange={(e) => setDraft((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
          rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">상담 슬롯 (분)</label>
        <select
          value={draft.slotMinutes}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, slotMinutes: Number(e.target.value) }))
          }
          className="min-h-[44px] rounded-xl border border-slate-200 px-3 text-sm"
        >
          {[20, 30, 40, 50, 60].map((m) => (
            <option key={m} value={m}>
              {m}분
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
          <Settings2 className="w-3.5 h-3.5" />
          요일별 상담 가능 시간
        </p>
        {sortedAvailability.map((day) => (
          <div
            key={day.dayOfWeek}
            className="grid grid-cols-[auto_1fr_1fr] sm:grid-cols-[64px_auto_1fr_1fr] gap-2 items-center rounded-xl border border-slate-100 p-2"
          >
            <label className="flex items-center gap-2 min-h-[44px]">
              <input
                type="checkbox"
                checked={day.enabled}
                onChange={(e) => updateDay(day.dayOfWeek, { enabled: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-bold text-slate-700">{day.dayOfWeek}</span>
            </label>
            <input
              type="time"
              value={day.startTime}
              disabled={!day.enabled}
              onChange={(e) => updateDay(day.dayOfWeek, { startTime: e.target.value })}
              className="min-h-[44px] rounded-lg border border-slate-200 px-2 text-sm disabled:opacity-50"
            />
            <input
              type="time"
              value={day.endTime}
              disabled={!day.enabled}
              onChange={(e) => updateDay(day.dayOfWeek, { endTime: e.target.value })}
              className="min-h-[44px] rounded-lg border border-slate-200 px-2 text-sm disabled:opacity-50"
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-500">휴무일 (YYYY-MM-DD)</p>
        <div className="flex gap-2">
          <input
            type="date"
            value={blockedDateInput}
            onChange={(e) => setBlockedDateInput(e.target.value)}
            className="flex-1 min-h-[44px] rounded-xl border border-slate-200 px-3 text-sm"
          />
          <button
            type="button"
            onClick={addBlockedDate}
            className="min-h-[44px] px-4 rounded-xl bg-slate-100 text-sm font-bold text-slate-700"
          >
            추가
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {draft.blockedDates.map((date) => (
            <button
              key={date}
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  blockedDates: prev.blockedDates.filter((d) => d !== date),
                }))
              }
              className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600"
            >
              {date} ×
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSave(draft)}
        className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold"
      >
        <Save className="w-4 h-4" />
        설정 저장
      </button>
    </div>
  );
};
