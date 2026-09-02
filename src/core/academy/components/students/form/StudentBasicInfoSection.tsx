import React from 'react';
import { User } from 'lucide-react';
import type { StudentFormData } from './studentFormTypes';

interface Props {
  formData: StudentFormData;
  onChange: (patch: Partial<StudentFormData>) => void;
}

export const StudentBasicInfoSection: React.FC<Props> = ({ formData, onChange }) => (
  <section>
    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
      <User className="w-3.5 h-3.5" /> 학생 정보
    </h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          학생 이름 <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">생년월일</label>
        <input
          type="date"
          value={formData.birthDate}
          onChange={(e) => onChange({ birthDate: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">연락처 (선택)</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>
    </div>
  </section>
);
