import React from 'react';
import type { ClassItem } from '@/types';

interface SubjectOption {
  id: string;
  label: string;
}

interface Props {
  subject: string;
  classId: string;
  subjectOptions: SubjectOption[];
  classes: ClassItem[];
  onSubjectChange: (subject: string) => void;
  onClassChange: (classId: string) => void;
}

/** 과목 + 대상 반 선택 (숙제·시험 공통) */
export const AcademySubjectClassFields: React.FC<Props> = ({
  subject,
  classId,
  subjectOptions,
  classes,
  onSubjectChange,
  onClassChange,
}) => (
  <>
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">과목</label>
      <select
        value={subject}
        onChange={(e) => onSubjectChange(e.target.value)}
        className="w-full px-3 py-2 min-h-[44px] text-sm border border-slate-200 rounded-xl"
      >
        {subjectOptions.map((s) => (
          <option key={s.id} value={s.label}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">대상</label>
      <select
        value={classId}
        onChange={(e) => onClassChange(e.target.value)}
        className="w-full px-3 py-2 min-h-[44px] text-sm border border-slate-200 rounded-xl"
      >
        <option value="">재원생 전체</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  </>
);
