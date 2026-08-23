import React from 'react';
import { BookOpen } from 'lucide-react';
import type { AcademySettings } from '@/types';
import {
  ACADEMY_SUBJECT_CATALOG,
  DEFAULT_ACADEMY_SUBJECT_IDS,
  getAcademySubjectIds,
} from '../../config/subjects';

interface Props {
  settings: AcademySettings;
  onChange: (next: AcademySettings) => void;
}

/** 종합학원 운영 과목 복수 선택 */
export const AcademySubjectsPanel: React.FC<Props> = ({ settings, onChange }) => {
  const selected = getAcademySubjectIds(settings);

  const toggleSubject = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    if (next.length === 0) return;
    onChange({ ...settings, academySubjects: next });
  };

  const selectDefaults = () => {
    onChange({ ...settings, academySubjects: [...DEFAULT_ACADEMY_SUBJECT_IDS] });
  };

  const selectAll = () => {
    onChange({
      ...settings,
      academySubjects: ACADEMY_SUBJECT_CATALOG.map((s) => s.id),
    });
  };

  return (
    <div className="pt-4 border-t border-slate-100 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            운영 과목 <span className="text-rose-500">*</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            이 학원에서 가르치는 과목을 선택하세요. 반·숙제·시험에서 사용됩니다.
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            type="button"
            onClick={selectDefaults}
            className="px-2.5 py-1.5 min-h-[44px] text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
          >
            국·수·영
          </button>
          <button
            type="button"
            onClick={selectAll}
            className="px-2.5 py-1.5 min-h-[44px] text-[10px] font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            전체
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ACADEMY_SUBJECT_CATALOG.map((subject) => {
          const isOn = selected.includes(subject.id);
          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => toggleSubject(subject.id)}
              className={`px-3.5 py-2.5 min-h-[44px] text-xs font-bold rounded-xl border transition-all ${
                isOn
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {subject.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400">
        선택됨: {selected.length}과목 · 최소 1과목 이상 필요
      </p>
    </div>
  );
};
