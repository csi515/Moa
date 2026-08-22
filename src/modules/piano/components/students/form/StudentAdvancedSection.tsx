import React from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import type { Teacher } from '@/types';
import type { StudentFormData } from './studentFormTypes';
import { LEVEL_OPTIONS } from './studentFormTypes';

interface Props {
  formData: StudentFormData;
  teachers: Teacher[];
  showAdvanced: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<StudentFormData>) => void;
}

export const StudentAdvancedSection: React.FC<Props> = ({
  formData,
  teachers,
  showAdvanced,
  onToggle,
  onChange,
}) => (
  <section>
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-600"
    >
      <span className="flex items-center gap-1.5">
        <BookOpen className="w-3.5 h-3.5" /> 수업·수강료 (선택)
      </span>
      {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
    {showAdvanced && (
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
        <input
          type="text"
          placeholder="학교"
          value={formData.school}
          onChange={(e) => onChange({ school: e.target.value })}
          className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
        />
        <input
          type="text"
          placeholder="학년"
          value={formData.grade}
          onChange={(e) => onChange({ grade: e.target.value })}
          className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
        />
        <select
          value={formData.level}
          onChange={(e) => onChange({ level: e.target.value as StudentFormData['level'] })}
          className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
        >
          {LEVEL_OPTIONS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select
          value={formData.teacherId}
          onChange={(e) => onChange({ teacherId: e.target.value })}
          className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
        >
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <CurrencyInput
          value={formData.tuitionFee}
          onChange={(val) => onChange({ tuitionFee: val })}
        />
        <select
          value={formData.paymentDay}
          onChange={(e) => onChange({ paymentDay: Number(e.target.value) })}
          className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
        >
          {[1, 5, 10, 15, 20, 25, 28].map((d) => (
            <option key={d} value={d}>매월 {d}일</option>
          ))}
        </select>
      </div>
    )}
  </section>
);
