import React from 'react';
import { Building2, ChevronRight } from 'lucide-react';
import { useParentPortal } from '@/core/parent/context/ParentPortalContext';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_LABELS,
  INACTIVE_ENROLLMENT_STATUSES,
  type StudentEnrollment,
} from '@/core/parent/types/globalParent';
import { getIndustryLabel, normalizeIndustryType } from '@/core/industry/types';

export const ParentAcademyPicker: React.FC = () => {
  const { selectedStudent, selectEnrollment } = useParentPortal();

  if (!selectedStudent) return null;

  const active = selectedStudent.enrollments.filter((e) =>
    ACTIVE_ENROLLMENT_STATUSES.includes(e.status)
  );
  const inactive = selectedStudent.enrollments.filter((e) =>
    INACTIVE_ENROLLMENT_STATUSES.includes(e.status)
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-slate-500">{selectedStudent.displayName}</p>
        <h2 className="text-lg font-black text-slate-900">학원 선택</h2>
      </div>

      {active.length > 0 && (
        <EnrollmentSection title="재원 · 휴원" enrollments={active} onSelect={selectEnrollment} />
      )}

      {inactive.length > 0 && (
        <EnrollmentSection title="퇴원 · 졸업" enrollments={inactive} onSelect={selectEnrollment} muted />
      )}

      {selectedStudent.enrollments.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200">
          등록된 학원이 없습니다.
        </div>
      )}
    </div>
  );
};

function EnrollmentSection({
  title,
  enrollments,
  onSelect,
  muted,
}: {
  title: string;
  enrollments: StudentEnrollment[];
  onSelect: (e: StudentEnrollment) => void;
  muted?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      {enrollments.map((enrollment) => (
        <button
          key={enrollment.enrollmentId}
          type="button"
          onClick={() => onSelect(enrollment)}
          className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left min-h-[44px] transition-colors ${
            muted
              ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                muted ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">{enrollment.organizationName}</p>
              <p className="text-xs text-slate-500">
                {getIndustryLabel(normalizeIndustryType(enrollment.industryType))} ·{' '}
                {ENROLLMENT_STATUS_LABELS[enrollment.status]}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </button>
      ))}
    </div>
  );
}
