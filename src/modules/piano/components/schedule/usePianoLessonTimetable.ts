import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { weekdayFromDate } from '@/core/academy/utils/weekdayKo';
import { useMediaQuery, useStaffScope, useStorageRefresh } from '@/hooks';
import { StorageService } from '@/services/storage';
import type { DayOfWeek, Student } from '@/types';
import type { DragPlacementPayload } from './PianoTimetablePanels';
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

export type TimetableLayoutMode = 'week' | 'byTeacher';

/**
 * 수업 시간표 — 필터·배치·이동·제거.
 * ClassItem + student.classIds만 변경. DAY_ATTENDANCE는 건드리지 않음.
 */
export function usePianoLessonTimetable() {
  const { showToast, openConfirmDialog, triggerRefresh } = useApp();
  const refreshKey = useStorageRefresh();
  const { isScoped, staffId, scopeClasses, scopeStudents } = useStaffScope();
  const useDragGrid = useMediaQuery('(min-width: 1024px) and (hover: hover) and (pointer: fine)');

  const todayDay = weekdayFromDate();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDay);
  const [teacherFilter, setTeacherFilter] = useState('ALL');
  const [layoutMode, setLayoutMode] = useState<TimetableLayoutMode>('week');
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

  const preferredTeacherId = teacherFilter !== 'ALL' ? teacherFilter : undefined;

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
    triggerRefresh();
  };

  const movePlacement = (
    payload: DragPlacementPayload,
    day: DayOfWeek,
    startTime: TimetableSlot,
    sectionTeacherId?: string
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
      preferredTeacherId: sectionTeacherId || preferredTeacherId,
    });
    if (!result.ok) {
      showToast(result.message, 'warning');
      return;
    }
    showToast(`${student.name} 학생을 ${day}요일 ${startTime}(으)로 이동했습니다.`, 'success');
    triggerRefresh();
  };

  const handleDropStudent = (studentId: string, day: DayOfWeek, startTime: TimetableSlot) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    placeStudent(student, day, startTime);
  };

  const handleRemove = (placement: SlotPlacement, day: DayOfWeek, startTime: TimetableSlot) => {
    openConfirmDialog({
      title: '배치 제거',
      message: `${placement.student.name} 학생을 ${day}요일 ${startTime} 예정에서 제거할까요?\n(출결 기록은 변경되지 않습니다.)`,
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
        triggerRefresh();
      },
    });
  };

  const openPickerForSlot = (
    day: DayOfWeek,
    startTime: TimetableSlot,
    sectionTeacherId?: string
  ) => {
    setPendingStudentId(null);
    setPendingTeacherId(sectionTeacherId);
    setPickerQuery('');
    setPickerSlot({ day, startTime, preferredTeacherId: sectionTeacherId });
  };

  const startPlaceStudent = (student: Student, sectionTeacherId?: string) => {
    setPickerSlot(null);
    setPendingStudentId(student.id);
    setPendingTeacherId(sectionTeacherId);
    showToast(`${student.name} 학생을 배치할 시간대를 탭하세요.`, 'info');
  };

  const placePending = (day: DayOfWeek, startTime: TimetableSlot, sectionTeacherId?: string) => {
    const student = students.find((s) => s.id === pendingStudentId);
    if (student) placeStudent(student, day, startTime, sectionTeacherId || pendingTeacherId);
  };

  const pickerExcludeIds = useMemo(() => {
    if (!pickerSlot) return undefined;
    return new Set(
      getPlacementsForSlot(
        students,
        visibleClasses,
        pickerSlot.day,
        pickerSlot.startTime
      ).map((p) => p.student.id)
    );
  }, [pickerSlot, students, visibleClasses]);

  return {
    useDragGrid,
    todayDay,
    selectedDay,
    setSelectedDay,
    teacherFilter,
    setTeacherFilter,
    layoutMode,
    setLayoutMode,
    pickerSlot,
    setPickerSlot,
    pickerQuery,
    setPickerQuery,
    pickerExcludeIds,
    pendingStudentId,
    isScoped,
    teachers,
    students,
    visibleClasses,
    teacherSections,
    placedIds,
    placeStudent,
    movePlacement,
    handleDropStudent,
    handleRemove,
    openPickerForSlot,
    startPlaceStudent,
    placePending,
  };
}
