import { useCallback, useEffect, useState, type FC, type FormEvent } from 'react';
import { CalendarOff, Clock, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { PageHeader, EmptyState } from '@/shared/components';
import { availabilityService } from '../services/availabilityService';
import { materializeAvailabilitySlots } from '../services/materializeAvailabilitySlots';
import {
  DAY_OF_WEEK_LABELS,
  type AvailabilityDayOfWeek,
  type AvailabilityOverride,
  type AvailabilityRule,
  type AvailabilitySlotMinutes,
} from '../types/availability';

const WEEKDAYS: AvailabilityDayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];
const SLOT_OPTIONS: AvailabilitySlotMinutes[] = [15, 20, 30, 45, 60];

interface AvailabilitySettingsViewProps {
  /** 화면 제목 (업종 라벨 주입) */
  title?: string;
  description?: string;
  defaultSlotTitle?: string;
  defaultSlotMinutes?: AvailabilitySlotMinutes;
  embedded?: boolean;
}

function toHm(value: string): string {
  return value.slice(0, 5);
}

export const AvailabilitySettingsView: FC<AvailabilitySettingsViewProps> = ({
  title = '가능 시간 설정',
  description = '반복 가능 시간과 날짜 예외를 설정한 뒤 예약 슬롯을 동기화합니다.',
  defaultSlotTitle = '상담',
  defaultSlotMinutes = 30,
  embedded = false,
}) => {
  const { showToast } = useApp();
  const { currentOrganization } = useOrganization();
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [dayOfWeek, setDayOfWeek] = useState<AvailabilityDayOfWeek>(1);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotMinutes, setSlotMinutes] = useState<AvailabilitySlotMinutes>(defaultSlotMinutes);

  const [overrideDate, setOverrideDate] = useState('');
  const [overrideClosed, setOverrideClosed] = useState(true);
  const [overrideStart, setOverrideStart] = useState('14:00');
  const [overrideEnd, setOverrideEnd] = useState('16:00');

  const load = useCallback(async () => {
    if (!currentOrganization) return;
    setLoading(true);
    try {
      const [nextRules, nextOverrides] = await Promise.all([
        availabilityService.listRules(currentOrganization.id),
        availabilityService.listOverrides(currentOrganization.id),
      ]);
      setRules(nextRules);
      setOverrides(nextOverrides);
    } catch (err) {
      console.error(err);
      showToast('가능 시간을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAddRule = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentOrganization) return;
    if (startTime >= endTime) {
      showToast('종료 시간은 시작 시간보다 늦어야 합니다.', 'error');
      return;
    }
    try {
      await availabilityService.createRule(currentOrganization.id, {
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        slot_minutes: slotMinutes,
        title: defaultSlotTitle,
      });
      showToast('반복 가능 시간을 추가했습니다.', 'success');
      await load();
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : '추가에 실패했습니다.', 'error');
    }
  };

  const handleRemoveRule = async (ruleId: string) => {
    try {
      await availabilityService.deactivateRule(ruleId);
      showToast('가능 시간을 숨겼습니다.', 'info');
      await load();
    } catch (err) {
      console.error(err);
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  const handleAddOverride = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentOrganization || !overrideDate) return;
    try {
      await availabilityService.upsertOverride(currentOrganization.id, {
        override_date: overrideDate,
        is_closed: overrideClosed,
        start_time: overrideClosed ? null : overrideStart,
        end_time: overrideClosed ? null : overrideEnd,
        slot_minutes: overrideClosed ? null : slotMinutes,
        title: defaultSlotTitle,
      });
      showToast('날짜 예외를 저장했습니다.', 'success');
      setOverrideDate('');
      await load();
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : '예외 저장에 실패했습니다.', 'error');
    }
  };

  const handleRemoveOverride = async (id: string) => {
    try {
      await availabilityService.deactivateOverride(id);
      showToast('예외를 숨겼습니다.', 'info');
      await load();
    } catch (err) {
      console.error(err);
      showToast('예외 삭제에 실패했습니다.', 'error');
    }
  };

  const handleSync = async () => {
    if (!currentOrganization) return;
    setSyncing(true);
    try {
      const result = await materializeAvailabilitySlots(currentOrganization.id);
      showToast(
        `슬롯 동기화 완료 · 생성 ${result.created} · 유지 ${result.kept} · 숨김 ${result.hidden}`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : '동기화에 실패했습니다.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className={embedded ? 'space-y-5' : 'space-y-4 pb-4'}>
      {!embedded && (
        <PageHeader
          icon={<Clock className="w-6 h-6" />}
          title={title}
          description={description}
          actions={
            <button
              type="button"
              onClick={() => void handleSync()}
              disabled={syncing}
              className="px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl flex items-center gap-2"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              예약 슬롯 동기화
            </button>
          }
        />
      )}

      {embedded && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl flex items-center gap-2"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            예약 슬롯 동기화
          </button>
        </div>
      )}

      <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">반복 가능 시간</h3>
        <form onSubmit={handleAddRule} className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value) as AvailabilityDayOfWeek)}
            className="px-3 py-2.5 min-h-[44px] text-sm rounded-xl border border-slate-200 bg-slate-50"
          >
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>
                {DAY_OF_WEEK_LABELS[d]}요일
              </option>
            ))}
          </select>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="px-3 py-2.5 min-h-[44px] text-sm rounded-xl border border-slate-200 bg-slate-50"
            required
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="px-3 py-2.5 min-h-[44px] text-sm rounded-xl border border-slate-200 bg-slate-50"
            required
          />
          <select
            value={slotMinutes}
            onChange={(e) => setSlotMinutes(Number(e.target.value) as AvailabilitySlotMinutes)}
            className="px-3 py-2.5 min-h-[44px] text-sm rounded-xl border border-slate-200 bg-slate-50"
          >
            {SLOT_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}분
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-2.5 min-h-[44px] bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            추가
          </button>
        </form>

        {rules.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-8 h-8" />}
            title="설정된 가능 시간이 없습니다"
            description="예: 월요일 14:00~17:00처럼 반복 시간을 추가하세요."
          />
        ) : (
          <ul className="space-y-2">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="text-sm">
                  <p className="font-bold text-slate-900">
                    {DAY_OF_WEEK_LABELS[rule.day_of_week]}요일{' '}
                    {toHm(rule.start_time)} ~ {toHm(rule.end_time)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rule.title} · {rule.slot_minutes}분 단위 · 정원 {rule.max_capacity}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRemoveRule(rule.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600"
                  aria-label="숨기기"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">날짜 예외</h3>
        <form onSubmit={handleAddOverride} className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="date"
              value={overrideDate}
              onChange={(e) => setOverrideDate(e.target.value)}
              className="px-3 py-2.5 min-h-[44px] text-sm rounded-xl border border-slate-200 bg-slate-50"
              required
            />
            <label className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-sm text-slate-700">
              <input
                type="checkbox"
                checked={overrideClosed}
                onChange={(e) => setOverrideClosed(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
              이날 불가
            </label>
            {!overrideClosed && (
              <>
                <input
                  type="time"
                  value={overrideStart}
                  onChange={(e) => setOverrideStart(e.target.value)}
                  className="px-3 py-2.5 min-h-[44px] text-sm rounded-xl border border-slate-200 bg-slate-50"
                />
                <input
                  type="time"
                  value={overrideEnd}
                  onChange={(e) => setOverrideEnd(e.target.value)}
                  className="px-3 py-2.5 min-h-[44px] text-sm rounded-xl border border-slate-200 bg-slate-50"
                />
              </>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 min-h-[44px] border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
          >
            예외 저장
          </button>
        </form>

        {overrides.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">등록된 날짜 예외가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {overrides.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="text-sm flex items-start gap-2">
                  <CalendarOff className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">{item.override_date}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.is_closed
                        ? '상담 불가'
                        : `${toHm(item.start_time || '')} ~ ${toHm(item.end_time || '')}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRemoveOverride(item.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600"
                  aria-label="예외 숨기기"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-slate-500 leading-relaxed">
        가능 시간을 저장한 뒤 <strong>예약 슬롯 동기화</strong>를 누르면 앞으로 14일간의
        예약 가능 시간이 생성됩니다. 기존 일정과 겹치는 시간은 자동으로 제외됩니다.
      </p>
    </div>
  );
};
