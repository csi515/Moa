import type { ClassItem, DayOfWeek, Student, Teacher } from '@/types';
import { StorageService } from '@/services/storage';

export const TIMETABLE_DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일'];

export const TIMETABLE_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
] as const;

export type TimetableSlot = (typeof TIMETABLE_SLOTS)[number];

export interface SlotPlacement {
  student: Student;
  classItem: ClassItem;
  /** 단일 요일·정시 슬롯 클래스만 시간표에서 이동/제거 가능 */
  editable: boolean;
}

export function slotEndTime(startTime: string): string {
  const [h, m] = startTime.split(':').map((n) => parseInt(n, 10) || 0);
  const total = h * 60 + m + 50;
  const eh = Math.floor(total / 60);
  const em = total % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

export function slotHour(time: string): number {
  return parseInt(time.split(':')[0], 10) || 0;
}

/** 시간표에서 직접 편집 가능한 슬롯용 클래스 (단일 요일 + 정시 시작) */
export function isEditableSlotClass(
  cls: ClassItem,
  day: DayOfWeek,
  startTime: string
): boolean {
  return (
    cls.daysOfWeek.length === 1 &&
    cls.daysOfWeek[0] === day &&
    cls.startTime === startTime
  );
}

export function findEditableSlotClass(
  classes: ClassItem[],
  day: DayOfWeek,
  startTime: string,
  preferredTeacherId?: string
): ClassItem | undefined {
  const matches = classes.filter((cls) => isEditableSlotClass(cls, day, startTime));
  if (preferredTeacherId) {
    return matches.find((cls) => cls.teacherId === preferredTeacherId);
  }
  return matches[0];
}

export function classesMatchingSlot(
  classes: ClassItem[],
  day: DayOfWeek,
  startTime: string
): ClassItem[] {
  const hour = slotHour(startTime);
  return classes.filter(
    (cls) => cls.daysOfWeek.includes(day) && slotHour(cls.startTime) === hour
  );
}

export function getPlacementsForSlot(
  students: Student[],
  classes: ClassItem[],
  day: DayOfWeek,
  startTime: string
): SlotPlacement[] {
  const matching = classesMatchingSlot(classes, day, startTime);
  const byStudent = new Map<string, SlotPlacement>();

  for (const cls of matching) {
    for (const student of students) {
      if (student.status !== 'active') continue;
      if (!student.classIds?.includes(cls.id)) continue;
      const editable = isEditableSlotClass(cls, day, startTime);
      const prev = byStudent.get(student.id);
      if (!prev || (editable && !prev.editable)) {
        byStudent.set(student.id, { student, classItem: cls, editable });
      }
    }
  }

  return Array.from(byStudent.values()).sort((a, b) =>
    a.student.name.localeCompare(b.student.name, 'ko')
  );
}

function resolveTeacher(
  teachers: Teacher[],
  preferredTeacherId?: string
): Pick<Teacher, 'id' | 'name'> {
  if (preferredTeacherId) {
    const preferred = teachers.find((t) => t.id === preferredTeacherId);
    if (preferred) return { id: preferred.id, name: preferred.name };
  }
  const active = teachers.find((t) => t.status === 'active') || teachers[0];
  return active ? { id: active.id, name: active.name } : { id: '', name: '미배정' };
}

function defaultRoom(): string {
  const settings = StorageService.getSettings();
  const room = settings.rooms?.find((r) => r.name)?.name;
  return room || '연습실';
}

/** 슬롯용 ClassItem 확보 (없으면 생성). 학생 데이터는 복제하지 않음. */
export function ensureEditableSlotClass(params: {
  classes: ClassItem[];
  day: DayOfWeek;
  startTime: string;
  teachers: Teacher[];
  minCapacity?: number;
  preferredTeacherId?: string;
}): ClassItem {
  const existing = findEditableSlotClass(
    params.classes,
    params.day,
    params.startTime,
    params.preferredTeacherId
  );
  const minCapacity = Math.max(params.minCapacity ?? 4, 1);

  if (existing) {
    if (existing.capacity >= minCapacity) return existing;
    return StorageService.saveClass({
      ...existing,
      capacity: minCapacity,
    });
  }

  const teacher = resolveTeacher(params.teachers, params.preferredTeacherId);
  return StorageService.saveClass({
    name: `${params.day} ${params.startTime} 레슨`,
    teacherId: teacher.id,
    teacherName: teacher.name,
    daysOfWeek: [params.day],
    startTime: params.startTime,
    endTime: slotEndTime(params.startTime),
    capacity: minCapacity,
    room: defaultRoom(),
    color: '#4f46e5',
  });
}

function saveStudentClassIds(student: Student, classIds: string[]): Student {
  return StorageService.saveStudent({
    ...student,
    classIds,
  });
}

/**
 * 같은 요일의 다른 편집 가능 슬롯에서 학생을 제거한 뒤 대상 슬롯에 배치.
 * 복수 요일 반(class) 소속은 유지한다.
 */
export function assignStudentToSlot(params: {
  student: Student;
  day: DayOfWeek;
  startTime: string;
  classes: ClassItem[];
  teachers: Teacher[];
  preferredTeacherId?: string;
}): { ok: true; classItem: ClassItem; student: Student } | { ok: false; message: string } {
  const { student, day, startTime, teachers, preferredTeacherId } = params;
  let classes = [...params.classes];

  if (student.status !== 'active') {
    return { ok: false, message: '재원 학생만 시간표에 배치할 수 있습니다.' };
  }

  const already = getPlacementsForSlot([student], classes, day, startTime);
  if (already.some((p) => p.student.id === student.id && p.editable)) {
    return { ok: false, message: '이미 해당 시간대에 배치되어 있습니다.' };
  }

  // 같은 요일의 다른 단일 슬롯에서 제거 (하루 한 레슨 시간 기준)
  let nextIds = [...(student.classIds || [])];
  for (const cls of classes) {
    if (!nextIds.includes(cls.id)) continue;
    if (cls.daysOfWeek.length !== 1 || cls.daysOfWeek[0] !== day) continue;
    if (cls.startTime === startTime) continue;
    nextIds = nextIds.filter((id) => id !== cls.id);
  }

  const currentInSlot = getPlacementsForSlot(
    StorageService.getStudents().filter((s) => s.id !== student.id),
    preferredTeacherId
      ? classes.filter((c) => c.teacherId === preferredTeacherId)
      : classes,
    day,
    startTime
  ).length;

  const slotClass = ensureEditableSlotClass({
    classes,
    day,
    startTime,
    teachers,
    minCapacity: currentInSlot + 1,
    preferredTeacherId,
  });

  if (!nextIds.includes(slotClass.id)) {
    nextIds = [...nextIds, slotClass.id];
  }

  const saved = saveStudentClassIds(student, nextIds);
  return { ok: true, classItem: slotClass, student: saved };
}

export function removeStudentFromSlot(params: {
  student: Student;
  classItem: ClassItem;
  day: DayOfWeek;
  startTime: string;
}): { ok: true; student: Student } | { ok: false; message: string } {
  const { student, classItem, day, startTime } = params;
  if (!isEditableSlotClass(classItem, day, startTime)) {
    return {
      ok: false,
      message: '여러 요일·정시 외(:30 등) 반은 정규 레슨 관리에서 수정해 주세요.',
    };
  }
  const nextIds = (student.classIds || []).filter((id) => id !== classItem.id);
  const saved = saveStudentClassIds(student, nextIds);
  return { ok: true, student: saved };
}

export function moveStudentToSlot(params: {
  student: Student;
  from?: { classItem: ClassItem; day: DayOfWeek; startTime: string };
  toDay: DayOfWeek;
  toStartTime: string;
  classes: ClassItem[];
  teachers: Teacher[];
  preferredTeacherId?: string;
}): { ok: true; student: Student } | { ok: false; message: string } {
  let student = params.student;
  let classes = params.classes;

  if (params.from) {
    const removed = removeStudentFromSlot({
      student,
      classItem: params.from.classItem,
      day: params.from.day,
      startTime: params.from.startTime,
    });
    if (!removed.ok) return removed;
    student = removed.student;
    classes = StorageService.getClasses();
  }

  const assigned = assignStudentToSlot({
    student,
    day: params.toDay,
    startTime: params.toStartTime,
    classes,
    teachers: params.teachers,
    preferredTeacherId: params.preferredTeacherId,
  });
  if (!assigned.ok) return assigned;
  return { ok: true, student: assigned.student };
}
