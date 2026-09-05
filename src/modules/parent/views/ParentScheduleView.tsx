import { useMemo } from 'react';
import { StorageService } from '@/services/storage';
import type { Student } from '@/types';
import { Section } from './shared';
import {
  getTodayClasses,
  getUpcomingWeekOccurrences,
} from '../utils/parentScheduleHelpers';

/** 등록 반·오늘/이번 주·주간 템플릿 (피아노·체육관) */
export function ParentScheduleView({ student }: { student: Student }) {
  const classes = useMemo(() => {
    const ids = new Set(student.classIds || []);
    return StorageService.getClasses()
      .filter((c) => ids.has(c.id))
      .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.name.localeCompare(b.name, 'ko'));
  }, [student.classIds]);

  const todayClasses = useMemo(() => getTodayClasses(classes), [classes]);
  const weekOccurrences = useMemo(() => getUpcomingWeekOccurrences(classes), [classes]);

  if (classes.length === 0) {
    return (
      <Section title={`${student.name} 수업 일정`}>
        <p className="text-sm text-slate-400 text-center py-6">
          등록된 수업 반이 없습니다. 학원에 문의해 주세요.
        </p>
      </Section>
    );
  }

  return (
    <div className="space-y-4">
      <Section title="오늘">
        {todayClasses.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">오늘 예정된 수업이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {todayClasses.map((cls) => (
              <li
                key={cls.id}
                className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50"
              >
                <p className="font-extrabold text-base text-slate-900">
                  {cls.startTime}–{cls.endTime}
                </p>
                <p className="font-bold text-sm text-slate-900 mt-1">{cls.name}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {[cls.teacherName, cls.room].filter(Boolean).join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="이번 주">
        <ul className="space-y-2">
          {weekOccurrences.map((occ) => (
            <li
              key={`${occ.date}-${occ.classItem.id}`}
              className="flex items-start justify-between gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50/80 min-h-[52px]"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">
                  {occ.dayLabel} {occ.classItem.startTime} · {occ.classItem.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {occ.date}
                  {occ.classItem.room ? ` · ${occ.classItem.room}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="등록 반 (매주)">
        <ul className="space-y-3">
          {classes.map((cls) => (
            <li
              key={cls.id}
              className="p-4 rounded-2xl border border-slate-100 bg-white"
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
      </Section>
    </div>
  );
}
