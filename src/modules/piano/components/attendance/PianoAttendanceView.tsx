import { type FC } from 'react';
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Users,
} from 'lucide-react';
import {
  EmptyState,
  FilterBar,
  PageHeader,
  SearchField,
  SummaryMetricCard,
} from '@/shared/components';
import { AbsentReasonModal } from './AbsentReasonModal';
import { PianoAttendanceRow } from './PianoAttendanceRow';
import { usePianoAttendanceView } from './usePianoAttendanceView';
import { shiftDateIso, todayIsoLocal, type StatusFilter } from './pianoAttendanceHelpers';

const FILTER_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'unchecked', label: '미등원' },
  { value: 'present', label: '등원' },
  { value: 'late', label: '지각' },
  { value: 'absent', label: '결석' },
];

/**
 * 피아노 출결 — 일정에 배정된 「오늘 예정」학생의 등원·지각·결석만 처리.
 * 하원 없음. 시간표 변경은 classIds만 바꾸고 DAY_ATTENDANCE 기록은 건드리지 않음.
 */
export const PianoAttendanceView: FC = () => {
  const {
    pinEnabled,
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    absentTarget,
    setAbsentTarget,
    pinCheckInIds,
    expectedCount,
    rosterCount,
    rows,
    stats,
    isToday,
    handleSetStatus,
    handleAbsentConfirm,
    openStudent,
    goPinCheckIn,
  } = usePianoAttendanceView();

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        density="compact"
        icon={<CheckSquare className="w-6 h-6" />}
        title="출결"
        description="일정에 배정된 학생이 실제로 왔는지 등원·지각·결석으로 기록합니다."
        actions={
          pinEnabled ? (
            <button
              type="button"
              onClick={goPinCheckIn}
              className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Fingerprint className="w-4 h-4 text-indigo-600" />
              PIN 출석
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        <SummaryMetricCard
          label={isToday ? '오늘 예정' : '예정'}
          value={`${stats.expected}명`}
          variant="indigo"
        />
        <SummaryMetricCard label="등원" value={`${stats.present}명`} variant="emerald" />
        <SummaryMetricCard label="지각" value={`${stats.late}명`} />
        <SummaryMetricCard label="결석" value={`${stats.absent}명`} />
        <SummaryMetricCard
          label="미등원"
          value={`${stats.unchecked}명`}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <FilterBar className="border-0 shadow-none rounded-none border-b border-slate-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => shiftDateIso(d, -1))}
              className="p-2 min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 hover:bg-slate-50"
              aria-label="이전 날짜"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 min-h-[44px] text-sm font-bold border border-slate-200 rounded-xl"
            />
            <button
              type="button"
              onClick={() => setSelectedDate((d) => shiftDateIso(d, 1))}
              className="p-2 min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 hover:bg-slate-50"
              aria-label="다음 날짜"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayIsoLocal())}
                className="px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold text-indigo-600 border border-indigo-100 bg-indigo-50"
              >
                오늘
              </button>
            )}
          </div>
          <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="학생 이름 검색"
            className="w-full sm:flex-1 sm:max-w-xs"
          />
        </FilterBar>

        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-slate-100">
          {FILTER_CHIPS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 min-h-[44px] sm:min-h-[36px] rounded-lg text-[11px] font-bold border transition-colors ${
                statusFilter === value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Users className="w-10 h-10" />}
            title={
              expectedCount === 0 && rosterCount === 0
                ? '이 날 예정된 학생이 없습니다'
                : '조건에 맞는 학생이 없습니다'
            }
            description={
              expectedCount === 0 && rosterCount === 0
                ? '일정(시간표)에서 학생을 배치하면 출결 목록에 나타납니다.'
                : '검색어나 상태 필터를 바꿔 보세요.'
            }
            className="border-0 shadow-none rounded-none"
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map(({ student, status, record, scheduleLabel, fromSchedule }) => (
              <PianoAttendanceRow
                key={student.id}
                student={student}
                status={status}
                pinCheckedIn={pinCheckInIds.has(student.id)}
                hasDayRecord={Boolean(record)}
                scheduleLabel={
                  scheduleLabel || (!fromSchedule ? '일정 외(당일 기록)' : undefined)
                }
                onOpenStudent={() => openStudent(student.id)}
                onSetStatus={(next) => handleSetStatus(student, next)}
              />
            ))}
          </ul>
        )}
      </div>

      <AbsentReasonModal
        isOpen={!!absentTarget}
        student={absentTarget}
        onClose={() => setAbsentTarget(null)}
        onConfirm={handleAbsentConfirm}
      />
    </div>
  );
};
