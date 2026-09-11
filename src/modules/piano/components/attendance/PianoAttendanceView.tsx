import { useMemo, useState, type FC } from 'react';
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Users,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useStaffScope, useStorageRefresh } from '@/hooks';
import { StorageService } from '@/services/storage';
import { StudentService } from '@/core/students';
import { notifyParentAbsence } from '@/core/academy/services/academyAlertService';
import { isAttendanceModuleEnabled } from '@/core/attendance/features';
import {
  EmptyState,
  FilterBar,
  PageHeader,
  SearchField,
  SummaryMetricCard,
} from '@/shared/components';
import type { AttendanceRecord, Student } from '@/types';
import { applySessionPassForAttendance } from '../../services/lessonPassConsume';
import { AbsentReasonModal } from './AbsentReasonModal';
import { PianoAttendanceRow } from './PianoAttendanceRow';
import {
  DAY_ATTENDANCE_CLASS_ID,
  DAY_ATTENDANCE_CLASS_NAME,
  STATUS_META,
  resolveDayStatus,
  shiftDateIso,
  todayIsoLocal,
  toAttendanceStatus,
  type DayStatus,
  type StatusFilter,
} from './pianoAttendanceHelpers';

const FILTER_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'unchecked', label: '미등원' },
  { value: 'present', label: '등원' },
  { value: 'late', label: '지각' },
  { value: 'absent', label: '결석' },
];

/** 피아노 출결 — 오늘 등원 현황 (레슨 노트·일정과 분리) */
export const PianoAttendanceView: FC = () => {
  const {
    currentUser,
    showToast,
    setActiveTab,
    setSelectedStudentId,
    openConfirmDialog,
    triggerRefresh,
  } = useApp();
  const refreshKey = useStorageRefresh();
  const { scopeStudents } = useStaffScope();
  const pinEnabled = isAttendanceModuleEnabled(StorageService.getSettings(), 'piano');

  const [selectedDate, setSelectedDate] = useState(todayIsoLocal);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [absentTarget, setAbsentTarget] = useState<Student | null>(null);

  const students = useMemo(
    () => scopeStudents(StudentService.getStudents()).filter((s) => s.status === 'active'),
    [scopeStudents, refreshKey]
  );
  const attendance = useMemo(() => StorageService.getAttendance(), [refreshKey]);
  const sessions = useMemo(() => StorageService.getAttendanceSessions(), [refreshKey]);

  const dayRecordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendance
      .filter((r) => r.date === selectedDate && r.classId === DAY_ATTENDANCE_CLASS_ID)
      .forEach((r) => map.set(r.studentId, r));
    return map;
  }, [attendance, selectedDate]);

  const pinCheckInIds = useMemo(() => {
    const set = new Set<string>();
    sessions
      .filter((s) => s.sessionDate === selectedDate && s.checkInAt)
      .forEach((s) => set.add(s.customerId));
    return set;
  }, [sessions, selectedDate]);

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .map((student) => {
        const record = dayRecordMap.get(student.id);
        const status = resolveDayStatus(record, pinCheckInIds.has(student.id));
        return { student, record, status };
      })
      .filter((row) => statusFilter === 'ALL' || row.status === statusFilter);
  }, [students, searchQuery, dayRecordMap, pinCheckInIds, statusFilter]);

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let unchecked = 0;
    students.forEach((s) => {
      const status = resolveDayStatus(dayRecordMap.get(s.id), pinCheckInIds.has(s.id));
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else unchecked++;
    });
    return { total: students.length, present, absent, late, unchecked };
  }, [students, dayRecordMap, pinCheckInIds]);

  const syncPinSession = (student: Student, status: DayStatus) => {
    if (status !== 'present' && status !== 'late') return;
    const existing = sessions.find(
      (s) => s.sessionDate === selectedDate && s.customerId === student.id
    );
    const now = new Date().toISOString();
    StorageService.saveAttendanceSession({
      id: existing?.id || `att-sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      customerId: student.id,
      customerName: student.name,
      sessionDate: selectedDate,
      checkInAt: existing?.checkInAt || now,
      checkInMethod: existing?.checkInMethod || 'manual',
      memo: existing?.memo,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    });
  };

  const persistStatus = (
    student: Student,
    status: Exclude<DayStatus, 'unchecked'>,
    memo?: string
  ) => {
    const existing = dayRecordMap.get(student.id);
    const nextStatus = toAttendanceStatus(status);
    const passResult = applySessionPassForAttendance({
      student,
      nextStatus,
      previous: existing || null,
      date: selectedDate,
    });
    if (passResult.warning) {
      showToast(passResult.warning, 'warning');
      return false;
    }

    StorageService.saveAttendanceRecord({
      ...(existing ? { id: existing.id } : {}),
      date: selectedDate,
      studentId: student.id,
      studentName: student.name,
      classId: DAY_ATTENDANCE_CLASS_ID,
      className: DAY_ATTENDANCE_CLASS_NAME,
      status: nextStatus,
      absentReason: status === 'absent' ? memo?.trim() || undefined : undefined,
      memo: memo?.trim() || undefined,
      createdBy: currentUser.name,
      sessionPassId: passResult.sessionPassId,
    });
    syncPinSession(student, status);

    if (status === 'absent') {
      notifyParentAbsence({
        studentId: student.id,
        studentName: student.name,
        parentPhone: student.parentPhone,
        className: DAY_ATTENDANCE_CLASS_NAME,
        date: selectedDate,
        reason: memo?.trim() || undefined,
      });
    }

    triggerRefresh();
    return true;
  };

  const handleSetStatus = (student: Student, status: Exclude<DayStatus, 'unchecked'>) => {
    if (status === 'absent') {
      setAbsentTarget(student);
      return;
    }
    if (!persistStatus(student, status)) return;
    showToast(
      `${student.name} 학생 ${STATUS_META[status].label} 처리되었습니다.`,
      'success'
    );
  };

  const handleAbsentConfirm = (reason: string) => {
    if (!absentTarget) return;
    const student = absentTarget;
    setAbsentTarget(null);
    if (!persistStatus(student, 'absent', reason)) return;
    showToast(`${student.name} 학생 결석 처리되었습니다.`, 'success');
    openConfirmDialog({
      title: '보강 일정',
      message: `${student.name} 학생 결석이 저장되었습니다. 지금 보강 일정을 잡을까요?`,
      confirmText: '보강 일정 잡기',
      cancelText: '나중에',
      onConfirm: () => setActiveTab('makeups'),
    });
  };

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        density="compact"
        icon={<CheckSquare className="w-6 h-6" />}
        title="출결"
        description="오늘 등원 현황을 확인하고 등원·결석·지각을 처리합니다. 레슨 노트는 일정 > 레슨에서 관리합니다."
        actions={
          pinEnabled ? (
            <button
              type="button"
              onClick={() => setActiveTab('check-in')}
              className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Fingerprint className="w-4 h-4 text-indigo-600" />
              PIN 출석
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        <SummaryMetricCard label="학생" value={`${stats.total}명`} variant="indigo" />
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
              className={`px-3 py-1.5 min-h-[36px] rounded-lg text-[11px] font-bold border transition-colors ${
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
            title={students.length === 0 ? '등록된 학생이 없습니다' : '조건에 맞는 학생이 없습니다'}
            description={
              students.length === 0
                ? '학생을 등록하면 등원 현황을 관리할 수 있습니다.'
                : '검색어나 상태 필터를 바꿔 보세요.'
            }
            className="border-0 shadow-none rounded-none"
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map(({ student, status, record }) => (
              <PianoAttendanceRow
                key={student.id}
                student={student}
                status={status}
                pinCheckedIn={pinCheckInIds.has(student.id)}
                hasDayRecord={Boolean(record)}
                onOpenStudent={() => {
                  setSelectedStudentId(student.id);
                  setActiveTab('students');
                }}
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
