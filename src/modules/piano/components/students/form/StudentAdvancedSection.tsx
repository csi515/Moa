import React from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { usePermissions } from '@/core/auth/usePermissions';
import {
  getStudentLevelLabel,
  getStudentLevelOptions,
  showSchoolFields,
} from '@/core/students/levelOptions';
import type { Teacher } from '@/types';
import type { StudentFormData } from './studentFormTypes';

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
}) => {
  const { industry } = usePermissions();
  const levelOptions = getStudentLevelOptions(industry);
  const levelLabel = getStudentLevelLabel(industry);
  const showSchool = showSchoolFields(industry);

  return (
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
          {showSchool && (
            <>
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
            </>
          )}
          <div className={showSchool ? '' : 'sm:col-span-2'}>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">{levelLabel}</label>
            <select
              value={formData.level}
              onChange={(e) => onChange({ level: e.target.value as StudentFormData['level'] })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            >
              {levelOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <select
            value={formData.teacherId}
            onChange={(e) => onChange({ teacherId: e.target.value })}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
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
              <option key={d} value={d}>
                매월 {d}일
              </option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
};
