import { useMemo } from 'react';
import { StorageService } from '@/services/storage';
import type { Student } from '@/types';
import { Section } from './shared';

/** 등록 반·주간 수업 일정 (피아노·체육관) */
export function ParentScheduleView({ student }: { student: Student }) {
  const classes = useMemo(() => {
    const ids = new Set(student.classIds || []);
    return StorageService.getClasses()
      .filter((c) => ids.has(c.id))
      .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.name.localeCompare(b.name, 'ko'));
  }, [student.classIds]);

  return (
    <Section title={`${student.name} 수업 일정`}>
      {classes.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">
          등록된 수업 반이 없습니다. 학원에 문의해 주세요.
        </p>
      ) : (
        <ul className="space-y-3">
          {classes.map((cls) => (
            <li
              key={cls.id}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80"
            >
              <p className="font-bold text-sm text-slate-900">{cls.name}</p>
              <p className="text-xs text-slate-600 mt-1.5">
                {cls.daysOfWeek.join('·')} · {cls.startTime}–{cls.endTime}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {cls.teacherName}
                {cls.room ? ` · ${cls.room}` : ''}
              </p>
              {cls.memo && (
                <p className="text-[11px] text-slate-400 mt-2 whitespace-pre-wrap">{cls.memo}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
