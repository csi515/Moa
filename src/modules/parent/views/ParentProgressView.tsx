import React from 'react';
import { StorageService } from '@/services/storage';
import type { Student } from '@/types';
import { CheckCircle2, AlertCircle, Award } from 'lucide-react';
import { Section } from './shared';

export function ParentProgressView({ student }: { student: Student }) {
  const levels = StorageService.getCurriculumLevels();
  const items = StorageService.getCurriculumItems();
  const progress = StorageService.getCurriculumProgress(student.id);
  const achievements = StorageService.getAchievements(student.id);

  const studentLevel = levels.find((l) => l.name === student.level) || levels[0];
  const levelItems = studentLevel ? items.filter((i) => i.levelId === studentLevel.id) : [];

  return (
    <div className="space-y-4">
      <Section title={`커리큘럼 진도 (${student.level})`}>
        {levelItems.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">등록된 커리큘럼이 없습니다.</p>
        ) : (
          levelItems.map((item) => {
            const prog = progress.find((p) => p.curriculumItemId === item.id);
            const status = prog?.status || 'not_started';
            return (
              <div key={item.id} className="flex items-center gap-2 py-2 border-b border-slate-50 text-sm">
                {status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : status === 'in_progress' ? (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                )}
                <span className={status === 'completed' ? 'line-through text-slate-400' : ''}>{item.title}</span>
              </div>
            );
          })
        )}
      </Section>

      <Section title="시험·콩쿠르·등급">
        {achievements.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">기록이 없습니다.</p>
        ) : (
          achievements.map((a) => (
            <div key={a.id} className="py-3 border-b border-slate-50 last:border-0">
              <div className="flex items-start gap-2">
                <Award className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm break-words">{a.title}</p>
                  <p className="text-xs text-amber-700 font-semibold mt-0.5 break-words">
                    {a.result || (a.type === 'competition' ? '수상' : a.type)}
                    {a.levelLabel ? ` · ${a.levelLabel}` : ''}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 break-words">
                    {a.eventDate || '일정 미정'}
                    {a.songTitle ? ` · ${a.songTitle}` : ''}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </Section>

      <Section title="연습 기록">
        {StorageService.getPracticeRecords()
          .filter((p) => p.studentId === student.id)
          .slice(0, 8)
          .map((p) => (
            <div key={p.id} className="py-2 border-b border-slate-50 text-sm">
              <p className="text-xs text-slate-400">{p.date} · {p.minutes}분</p>
              <p>{p.songTitle || p.homework || '연습'}</p>
            </div>
          ))}
      </Section>
    </div>
  );
}
