import type { ClassItem, Student } from '@/types';
import { weekdayFromIsoDate } from '@/core/academy/utils/weekdayKo';

export interface ExpectedStudentOnDate {
  student: Student;
  /** 해당 요일에 배정된 반(시간표) */
  classes: ClassItem[];
  /** 가장 빠른 시작 시각 (정렬·표시용) */
  earliestStart: string;
}

/**
 * 일정(시간표) 기준 — 해당 날짜에 오기로 배정된 재원생.
 * classIds + ClassItem.daysOfWeek만 사용. 출결 기록은 읽지 않음.
 */
export function getExpectedStudentsOnDate(
  dateIso: string,
  students: Student[],
  classes: ClassItem[]
): ExpectedStudentOnDate[] {
  const day = weekdayFromIsoDate(dateIso);
  const classById = new Map(classes.map((c) => [c.id, c]));
  const rows: ExpectedStudentOnDate[] = [];

  for (const student of students) {
    if (student.status !== 'active') continue;
    const matched: ClassItem[] = [];
    for (const classId of student.classIds || []) {
      const cls = classById.get(classId);
      if (!cls) continue;
      if (!cls.daysOfWeek.includes(day)) continue;
      matched.push(cls);
    }
    if (matched.length === 0) continue;
    matched.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    rows.push({
      student,
      classes: matched,
      earliestStart: matched[0]?.startTime || '99:99',
    });
  }

  return rows.sort((a, b) => {
    const t = a.earliestStart.localeCompare(b.earliestStart);
    if (t !== 0) return t;
    return a.student.name.localeCompare(b.student.name, 'ko');
  });
}

/** 출결 행 부제 — 시간·반 이름 */
export function formatExpectedScheduleLabel(classes: ClassItem[]): string {
  if (classes.length === 0) return '';
  return classes
    .map((c) => {
      const time = c.startTime || '';
      const name = c.name?.trim();
      if (time && name) return `${time} ${name}`;
      return time || name || '';
    })
    .filter(Boolean)
    .join(' · ');
}
