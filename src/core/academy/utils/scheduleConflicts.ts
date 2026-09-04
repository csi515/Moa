import type { ClassItem, DayOfWeek, MakeupItem } from '@/types';

export type ScheduleConflictKind = 'teacher' | 'room';

export interface ScheduleConflict {
  kind: ScheduleConflictKind;
  withLabel: string;
  day?: DayOfWeek;
  date?: string;
  startTime: string;
  endTime: string;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

/** 시간 구간 겹침 (끝점 접침은 허용) */
export function timesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

export type ClassSlotCandidate = {
  teacherId: string;
  room: string;
  daysOfWeek: DayOfWeek[];
  startTime: string;
  endTime: string;
  excludeId?: string;
};

/** 정규 수업 간 강사·연습실 충돌 */
export function findClassConflicts(
  classes: ClassItem[],
  candidate: ClassSlotCandidate
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (const cls of classes) {
    if (candidate.excludeId && cls.id === candidate.excludeId) continue;
    const sharedDays = cls.daysOfWeek.filter((d) => candidate.daysOfWeek.includes(d));
    if (sharedDays.length === 0) continue;
    if (!timesOverlap(candidate.startTime, candidate.endTime, cls.startTime, cls.endTime)) {
      continue;
    }

    for (const day of sharedDays) {
      if (candidate.teacherId && cls.teacherId === candidate.teacherId) {
        conflicts.push({
          kind: 'teacher',
          withLabel: `${cls.name} (${cls.teacherName})`,
          day,
          startTime: cls.startTime,
          endTime: cls.endTime,
        });
      }
      if (candidate.room && cls.room && candidate.room === cls.room) {
        conflicts.push({
          kind: 'room',
          withLabel: `${cls.name} · ${cls.room}`,
          day,
          startTime: cls.startTime,
          endTime: cls.endTime,
        });
      }
    }
  }

  return conflicts;
}

export type MakeupSlotCandidate = {
  date: string;
  startTime: string;
  endTime: string;
  teacherId?: string;
  room?: string;
  excludeAttendanceId?: string;
};

const JS_DAY_TO_KO: Record<number, DayOfWeek> = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
};

export function weekdayFromIsoDate(isoDate: string): DayOfWeek {
  const d = new Date(`${isoDate}T12:00:00`);
  return JS_DAY_TO_KO[d.getDay()] || '월';
}

/** 보강 슬롯 vs 정규 수업·다른 보강 충돌 */
export function findMakeupSlotConflicts(params: {
  classes: ClassItem[];
  makeups: MakeupItem[];
  candidate: MakeupSlotCandidate;
}): ScheduleConflict[] {
  const { classes, makeups, candidate } = params;
  const conflicts: ScheduleConflict[] = [];
  const day = weekdayFromIsoDate(candidate.date);

  for (const cls of classes) {
    if (!cls.daysOfWeek.includes(day)) continue;
    if (!timesOverlap(candidate.startTime, candidate.endTime, cls.startTime, cls.endTime)) {
      continue;
    }
    if (candidate.teacherId && cls.teacherId === candidate.teacherId) {
      conflicts.push({
        kind: 'teacher',
        withLabel: `${cls.name} (${cls.teacherName})`,
        day,
        date: candidate.date,
        startTime: cls.startTime,
        endTime: cls.endTime,
      });
    }
    if (candidate.room && cls.room === candidate.room) {
      conflicts.push({
        kind: 'room',
        withLabel: `${cls.name} · ${cls.room}`,
        day,
        date: candidate.date,
        startTime: cls.startTime,
        endTime: cls.endTime,
      });
    }
  }

  for (const m of makeups) {
    if (m.status !== 'scheduled' || !m.makeUpDate || !m.makeUpStartTime || !m.makeUpEndTime) {
      continue;
    }
    if (candidate.excludeAttendanceId && m.attendanceId === candidate.excludeAttendanceId) {
      continue;
    }
    if (m.makeUpDate !== candidate.date) continue;
    if (
      !timesOverlap(candidate.startTime, candidate.endTime, m.makeUpStartTime, m.makeUpEndTime)
    ) {
      continue;
    }
    if (candidate.teacherId && m.makeUpTeacherId && candidate.teacherId === m.makeUpTeacherId) {
      conflicts.push({
        kind: 'teacher',
        withLabel: `보강 · ${m.studentName}`,
        date: m.makeUpDate,
        startTime: m.makeUpStartTime,
        endTime: m.makeUpEndTime,
      });
    }
    if (candidate.room && m.makeUpRoom && candidate.room === m.makeUpRoom) {
      conflicts.push({
        kind: 'room',
        withLabel: `보강 · ${m.studentName} (${m.makeUpRoom})`,
        date: m.makeUpDate,
        startTime: m.makeUpStartTime,
        endTime: m.makeUpEndTime,
      });
    }
  }

  return conflicts;
}

export function formatConflictSummary(conflicts: ScheduleConflict[]): string {
  if (conflicts.length === 0) return '';
  const lines = conflicts.slice(0, 3).map((c) => {
    const when = c.day || c.date || '';
    const kindLabel = c.kind === 'teacher' ? '강사' : '연습실';
    return `· ${kindLabel} 충돌: ${c.withLabel} (${when} ${c.startTime}–${c.endTime})`;
  });
  const more = conflicts.length > 3 ? `\n외 ${conflicts.length - 3}건` : '';
  return `${lines.join('\n')}${more}`;
}
