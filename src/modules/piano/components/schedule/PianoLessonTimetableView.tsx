import { useEffect, useMemo, useState, type FC } from 'react';
import { Clock, Filter, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useMediaQuery, useStaffScope, useStorageRefresh } from '@/hooks';
import { StorageService } from '@/services/storage';
import { EmptyState } from '@/shared/components';
import { FORM_CONTROL_CLASS } from '@/shared/components/ui';
import type { DayOfWeek, Student } from '@/types';
import {
  PianoTimetableDesktopGrid,
  PianoTimetableStudentPool,
} from './PianoTimetablePanels';
import { PianoTimetableMobileList } from './PianoTimetableMobileList';
import { PianoTimetableStudentPicker } from './PianoTimetableStudentPicker';
import {
  TIMETABLE_DAYS,
  TIMETABLE_SLOTS,
  assignStudentToSlot,
  getPlacementsForSlot,
  moveStudentToSlot,
  removeStudentFromSlot,
  type SlotPlacement,
  type TimetableSlot,
} from './pianoTimetablePlacement';
import type { DragPlacementPayload } from './PianoTimetablePanels';

const DAY_MAP: Record<number, DayOfWeek> = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
};

type LayoutMode = 'week' | 'byTeacher';

/**
 * 피아노 수업 시간표 — 요일·시간대에 레슨 예정 학생 배치.
 * ClassItem + student.classIds 재사용. 출결 자동 처리 없음.
 * 정시(09:00…) 그리드만 편집 가능. :30 시작 반은 표시만 되며 정규 레슨에서 수정.
 */
export const PianoLessonTimetableView: FC = () => {
  const { showToast, openConfirmDialog, triggerRefresh } = useApp();
  const refreshKey = useStorageRefresh();
  const { isScoped, staffId, scopeClasses, scopeStudents } = useStaffScope();
  /** 넓은 PC + 정밀 포인터에서만 DnD 그리드 (태블릿은 터치 목록) */
  const useDragGrid = useMediaQuery('(min-width: 1024px) and (hover: hover) and (pointer: fine)');

  const todayDay = DAY_MAP[new Date().getDay()] ?? null;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDay ?? '월');
  const [teacherFilter, setTeacherFilter] = useState('ALL');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('week');
  const [pickerSlot, setPickerSlot] = useState<{
    day: DayOfWeek;
    startTime: TimetableSlot;
    preferredTeacherId?: string;
  } | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pendingStudentId, setPendingStudentId] = useState<string | null>(null);
  const [pendingTeacherId, setPendingTeacherId] = useState<string | undefined>(undefined);

  const classes = useMemo(
    () => scopeClasses(StorageService.getClasses()),
    [scopeClasses, refreshKey]
  );
  const teachers = useMemo(() => {
    const list = StorageService.getTeachers().filter((t) => t.status === 'active');
    return list.length > 0 ? list : StorageService.getTeachers();
  }, [refreshKey]);
  const students = useMemo(
    () => scopeStudents(StorageService.getStudents()).filter((s) => s.status === 'active'),
    [scopeStudents, refreshKey]
  );

  useEffect(() => {
    if (isScoped && staffId) setTeacherFilter(staffId);
  }, [isScoped, staffId]);

  const preferredTeacherId =
    teacherFilter !== 'ALL' ? teacherFilter : undefined;

  const visibleClasses = useMemo(() => {
    if (teacherFilter === 'ALL') return classes;
    return classes.filter((c) => c.teacherId === teacherFilter);
  }, [classes, teacherFilter]);

  const teacherSections = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; classes: typeof classes }>();
    for (const cls of visibleClasses) {
      const id = cls.teacherId || '__none__';
      const name = cls.teacherName?.trim() || teachers.find((t) => t.id === id)?.name || '미배정';
      const bucket = byId.get(id);
      if (bucket) bucket.classes.push(cls);
      else byId.set(id, { id, name, classes: [cls] });
    }
    // 필터 ALL이면 선생님이지만 아직 반이 없는 경우도 섹션에 포함 (빈 그리드로 배치 가능)
    if (teacherFilter === 'ALL' && layoutMode === 'byTeacher') {
      for (const t of teachers) {
        if (!byId.has(t.id)) byId.set(t.id, { id: t.id, name: t.name, classes: [] });
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [visibleClasses, teachers, teacherFilter, layoutMode]);

  const placedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const day of TIMETABLE_DAYS) {
      for (const slot of TIMETABLE_SLOTS) {
        getPlacementsForSlot(students, visibleClasses, day, slot).forEach((p) =>
          ids.add(p.student.id)
        );
      }
    }
    return ids;
  }, [students, visibleClasses]);

  const refresh = () => triggerRefresh();

  const placeStudent = (
    student: Student,
    day: DayOfWeek,
    startTime: TimetableSlot,
    teacherId?: string
  ) => {
    const result = assignStudentToSlot({
      student,
      day,
      startTime,
      classes: StorageService.getClasses(),
      teachers,
      preferredTeacherId: teacherId || preferredTeacherId,
    });
    if (!result.ok) {
      showToast(result.message, 'warning');
      return;
    }
    showToast(`${student.name} 학생을 ${day}요일 ${startTime}에 배치했습니다.`, 'success');
    setPendingStudentId(null);
    setPendingTeacherId(undefined);
    setPickerSlot(null);
    refresh();
  };

  const handleDropStudent = (studentId: string, day: DayOfWeek, startTime: TimetableSlot) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    placeStudent(student, day, startTime);
  };

  const handleDropPlacement = (
    payload: DragPlacementPayload,
    day: DayOfWeek,
    startTime: TimetableSlot
  ) => {
    if (payload.day === day && payload.startTime === startTime) return;
    const student = students.find((s) => s.id === payload.studentId);
    const fromClass = classes.find((c) => c.id === payload.classId);
    if (!student || !fromClass) return;

    const result = moveStudentToSlot({
      student,
      from: { classItem: fromClass, day: payload.day, startTime: payload.startTime },
      toDay: day,
      toStartTime: startTime,
      classes: StorageService.getClasses(),
      teachers,
      preferredTeacherId,
    });
    if (!result.ok) {
      showToast(result.message, 'warning');
      return;
    }
    showToast(
      `${student.name} 학생을 ${day}요일 ${startTime}(으)로 이동했습니다.`,
      'success'
    );
    refresh();
  };

  const handleRemove = (placement: SlotPlacement, day: DayOfWeek, startTime: TimetableSlot) => {
    openConfirmDialog({
      title: '배치 제거',
      message: `${placement.student.name} 학생을 ${day}요일 ${startTime} 레슨 예정에서 제거할까요?\n(출결 기록은 변경되지 않습니다.)`,
      confirmText: '제거',
      onConfirm: () => {
        const result = removeStudentFromSlot({
          student: placement.student,
          classItem: placement.classItem,
          day,
          startTime,
        });
        if (!result.ok) {
          showToast(result.message, 'warning');
          return;
        }
        showToast(`${placement.student.name} 학생 배치를 제거했습니다.`, 'info');
        refresh();
      },
    });
  };

  const renderTimetable = (sectionClasses: typeof classes, sectionTeacherId?: string) => {
    if (useDragGrid) {
      return (
        <PianoTimetableDesktopGrid
          todayDay={todayDay}
          classes={sectionClasses}
          students={students}
          onDropStudent={(studentId, day, startTime) => {
            const student = students.find((s) => s.id === studentId);
            if (student) placeStudent(student, day, startTime, sectionTeacherId);
          }}
          onDropPlacement={(payload, day, startTime) => {
            if (payload.day === day && payload.startTime === startTime) return;
            const student = students.find((s) => s.id === payload.studentId);
            const fromClass = classes.find((c) => c.id === payload.classId);
            if (!student || !fromClass) return;
            const result = moveStudentToSlot({
              student,
              from: { classItem: fromClass, day: payload.day, startTime: payload.startTime },
              toDay: day,
              toStartTime: startTime,
              classes: StorageService.getClasses(),
              teachers,
              preferredTeacherId: sectionTeacherId || preferredTeacherId,
            });
            if (!result.ok) {
              showToast(result.message, 'warning');
              return;
            }
            showToast(
              `${student.name} 학생을 ${day}요일 ${startTime}(으)로 이동했습니다.`,
              'success'
            );
            refresh();
          }}
          onRemove={handleRemove}
        />
      );
    }

    return (
      <PianoTimetableMobileList
        selectedDay={selectedDay}
        todayDay={todayDay}
        classes={sectionClasses}
        students={students}
        pendingStudentId={pendingStudentId}
        onSelectDay={setSelectedDay}
        onPickSlotForAdd={(day, startTime) => {
          setPendingStudentId(null);
          setPendingTeacherId(sectionTeacherId);
          setPickerQuery('');
          setPickerSlot({ day, startTime, preferredTeacherId: sectionTeacherId });
        }}
        onPlacePending={(day, startTime) => {
          const student = students.find((s) => s.id === pendingStudentId);
          if (student) placeStudent(student, day, startTime, sectionTeacherId || pendingTeacherId);
        }}
        onRemove={handleRemove}
        onStartPlaceStudent={(student) => {
          setPickerSlot(null);
          setPendingStudentId(student.id);
          setPendingTeacherId(sectionTeacherId);
          showToast(`${student.name} 학생을 배치할 시간대를 탭하세요.`, 'info');
        }}
      />
    );
  };

  if (students.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-10 h-10" />}
        title="등록된 학생이 없습니다"
        description="학생을 등록한 뒤 시간표에 레슨 일정을 배치할 수 있습니다."
      />
    );
  }

  return (
    <div className="space-y-4 pb-2">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5 flex items-start gap-2">
        <Clock className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
        <p className="text-xs text-indigo-900 leading-relaxed">
          시간표 배치는 <strong className="font-bold">레슨 예정</strong>입니다. 등원·결석은 출결
          메뉴에서 별도로 처리합니다. 그리드는 정시(09:00…) 기준이며,{' '}
          <strong className="font-bold">:30 시작 반</strong>은 해당 시각대에 표시만 되고 편집은
          「정규 레슨」에서 하세요.
          {useDragGrid
            ? ' PC에서는 학생을 드래그해 시간대에 놓으세요.'
            : ' 시간대의 「학생 추가」또는 학생을 탭한 뒤 시간대를 선택하세요.'}
        </p>
      </div>

      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>보기</span>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-500">
          <button
            type="button"
            onClick={() => setLayoutMode('week')}
            className={`px-3 py-1.5 min-h-[40px] rounded-lg transition-all ${
              layoutMode === 'week' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            전체
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('byTeacher')}
            className={`px-3 py-1.5 min-h-[40px] rounded-lg transition-all ${
              layoutMode === 'byTeacher'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            선생님별
          </button>
        </div>

        {!isScoped && (
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className={`${FORM_CONTROL_CLASS} !min-h-[40px] !py-2 !text-xs w-auto min-w-[9rem]`}
            aria-label="선생님 필터"
          >
            <option value="ALL">전체 선생님</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}

        <span className="text-xs text-slate-500 font-semibold tabular-nums ml-auto">
          반 {visibleClasses.length}
          {layoutMode === 'byTeacher' ? ` · 선생님 ${teacherSections.length}` : ''}
        </span>
      </div>

      {useDragGrid && <PianoTimetableStudentPool students={students} placedIds={placedIds} />}

      {layoutMode === 'byTeacher' ? (
        <div className="space-y-5">
          {teacherSections.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">표시할 수업이 없습니다.</p>
          ) : (
            teacherSections.map((section) => (
              <section key={section.id} className="space-y-2">
                <div className="flex items-center gap-2 px-0.5">
                  <h3 className="text-sm font-black text-slate-900">{section.name} 선생님</h3>
                  <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                    반 {section.classes.length}
                  </span>
                </div>
                {renderTimetable(section.classes, section.id === '__none__' ? undefined : section.id)}
              </section>
            ))
          )}
        </div>
      ) : useDragGrid ? (
        <PianoTimetableDesktopGrid
          todayDay={todayDay}
          classes={visibleClasses}
          students={students}
          onDropStudent={handleDropStudent}
          onDropPlacement={handleDropPlacement}
          onRemove={handleRemove}
        />
      ) : (
        <PianoTimetableMobileList
          selectedDay={selectedDay}
          todayDay={todayDay}
          classes={visibleClasses}
          students={students}
          pendingStudentId={pendingStudentId}
          onSelectDay={setSelectedDay}
          onPickSlotForAdd={(day, startTime) => {
            setPendingStudentId(null);
            setPendingTeacherId(undefined);
            setPickerQuery('');
            setPickerSlot({ day, startTime });
          }}
          onPlacePending={(day, startTime) => {
            const student = students.find((s) => s.id === pendingStudentId);
            if (student) placeStudent(student, day, startTime, pendingTeacherId);
          }}
          onRemove={handleRemove}
          onStartPlaceStudent={(student) => {
            setPickerSlot(null);
            setPendingStudentId(student.id);
            setPendingTeacherId(undefined);
            showToast(`${student.name} 학생을 배치할 시간대를 탭하세요.`, 'info');
          }}
        />
      )}

      <PianoTimetableStudentPicker
        isOpen={!!pickerSlot}
        title="학생 선택"
        subtitle={
          pickerSlot ? `${pickerSlot.day}요일 ${pickerSlot.startTime}에 배치` : undefined
        }
        students={students}
        searchQuery={pickerQuery}
        onSearchChange={setPickerQuery}
        excludeIds={
          pickerSlot
            ? new Set(
                getPlacementsForSlot(
                  students,
                  visibleClasses,
                  pickerSlot.day,
                  pickerSlot.startTime
                ).map((p) => p.student.id)
              )
            : undefined
        }
        onClose={() => setPickerSlot(null)}
        onSelect={(student) => {
          if (!pickerSlot) return;
          placeStudent(
            student,
            pickerSlot.day,
            pickerSlot.startTime,
            pickerSlot.preferredTeacherId
          );
        }}
      />
    </div>
  );
};
