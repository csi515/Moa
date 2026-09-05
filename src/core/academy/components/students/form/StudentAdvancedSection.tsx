import React from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { usePermissions } from '@/core/auth/usePermissions';
import { useModuleLabels } from '@/core/labels';
import {
  getStudentLevelLabel,
  getStudentLevelOptions,
  showSchoolFields,
} from '@/core/students/levelOptions';
import type { ClassItem, Teacher } from '@/types';
import type { StudentFormData } from './studentFormTypes';

interface Props {
  formData: StudentFormData;
  teachers: Teacher[];
  classes: ClassItem[];
  showAdvanced: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<StudentFormData>) => void;
}

export const StudentAdvancedSection: React.FC<Props> = ({
  formData,
  teachers,
  classes,
  showAdvanced,
  onToggle,
  onChange,
}) => {
  const { industry } = usePermissions();
  const labels = useModuleLabels();
  const levelOptions = getStudentLevelOptions(industry);
  const levelLabel = getStudentLevelLabel(industry);
  const showSchool = showSchoolFields(industry);
  const serviceLabel = labels.service.singular;
  const isPiano = industry === 'piano';

  const toggleClass = (classId: string) => {
    const next = formData.classIds.includes(classId)
      ? formData.classIds.filter((id) => id !== classId)
      : [...formData.classIds, classId];
    onChange({ classIds: next });
  };

  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-600"
      >
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          {isPiano ? `${serviceLabel} · 수강료` : '수업·수강료 (선택)'}
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
            <option value="">담당 선생님</option>
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
                매월 {d}일 납부
              </option>
            ))}
          </select>

          <div className="sm:col-span-2 space-y-2">
            <label className="block text-[11px] font-semibold text-slate-500">
              {serviceLabel} 배정 {isPiano ? '(오늘 레슨 자동 표시)' : ''}
            </label>
            {classes.length === 0 ? (
              <p className="text-xs text-slate-400 px-1">
                등록된 {serviceLabel}이(가) 없습니다. 먼저 {serviceLabel}을(를) 추가하세요.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {classes.map((cls) => {
                  const active = formData.classIds.includes(cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => toggleClass(cls.id)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {cls.name}
                      <span className="block text-[10px] font-medium opacity-80 mt-0.5">
                        {cls.daysOfWeek.join('')} {cls.startTime}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
