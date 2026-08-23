import React from 'react';
import { CalendarRange } from 'lucide-react';
import type { StudentStatus } from '@/types';
import type { StudentFormData } from './studentFormTypes';

interface Props {
  formData: StudentFormData;
  onChange: (patch: Partial<StudentFormData>) => void;
}

const STATUS_OPTIONS: { value: StudentStatus; label: string; hint: string }[] = [
  { value: 'active', label: '재원', hint: '현재 수강 중' },
  { value: 'leave', label: '휴원', hint: '일시 휴원' },
  { value: 'withdrawn', label: '퇴원', hint: '학원 등록 종료' },
];

/** 학원 등록·휴원·퇴원 일정 관리 */
export const StudentEnrollmentSection: React.FC<Props> = ({ formData, onChange }) => {
  const handleStatusChange = (status: StudentStatus) => {
    const patch: Partial<StudentFormData> = { status };
    if (status === 'active') {
      patch.leaveDate = '';
    } else if ((status === 'leave' || status === 'withdrawn') && !formData.leaveDate) {
      patch.leaveDate = new Date().toISOString().slice(0, 10);
    }
    onChange(patch);
  };

  return (
    <section>
      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <CalendarRange className="w-3.5 h-3.5" /> 등록·퇴원
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            수강 상태 <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleStatusChange(e.target.value as StudentStatus)}
            className="w-full px-3 py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({o.hint})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            등록일 <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.joinDate}
            onChange={(e) => onChange({ joinDate: e.target.value })}
            className="w-full px-3 py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            휴원/퇴원일
          </label>
          <input
            type="date"
            value={formData.leaveDate}
            disabled={formData.status === 'active'}
            onChange={(e) => onChange({ leaveDate: e.target.value })}
            className="w-full px-3 py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
          />
        </div>
      </div>
      {formData.status !== 'active' && (
        <p className="text-[11px] text-slate-500 mt-2">
          {formData.status === 'leave'
            ? '휴원 중에는 출결·청구를 일시 중단하는 운영이 일반적입니다.'
            : '퇴원 처리된 원생은 목록에서 퇴원 필터로 확인할 수 있습니다.'}
        </p>
      )}
    </section>
  );
};
