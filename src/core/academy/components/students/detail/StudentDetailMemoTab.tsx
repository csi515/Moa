import React from 'react';
import { Student } from '@/types';
import { useModuleLabels } from '@/core/labels';
import { isSkinClinicIndustry } from '@/core/industry/industryUi';
import { usePermissions } from '@/core/auth/usePermissions';

interface StudentDetailMemoTabProps {
  student: Student;
}

/** 활동 탭 — 특이사항·내부 메모 (기존 memo 기능) */
export const StudentDetailMemoTab: React.FC<StudentDetailMemoTabProps> = ({ student }) => {
  const { industry } = usePermissions();
  const labels = useModuleLabels();
  const skin = isSkinClinicIndustry(industry);
  const customerLabel = skin ? labels.customer.singular : '원생';
  const placeLabel = skin ? '샵' : '학원';

  return (
  <div className="space-y-4">
    <p className="text-xs text-slate-500">
      {skin
        ? `${customerLabel} 관련 특이사항과 ${placeLabel} 내부 메모입니다.`
        : '원생 관련 특이사항과 학원 내부 메모입니다. 연습·연주영상은 더보기 탭에서 확인하세요.'}
    </p>

    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
      <h5 className="text-xs font-bold text-slate-700 uppercase">특이사항</h5>
      <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
        {student.specialNotes || '등록된 특이사항이 없습니다.'}
      </p>
    </div>

    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
      <h5 className="text-xs font-bold text-slate-700 uppercase">{placeLabel} 내부 메모</h5>
      <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
        {student.memo || '등록된 내부 메모가 없습니다.'}
      </p>
    </div>
  </div>
  );
};
