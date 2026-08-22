import React from 'react';
import { Student } from '@/types';

interface StudentDetailMemoTabProps {
  student: Student;
}

export const StudentDetailMemoTab: React.FC<StudentDetailMemoTabProps> = ({ student }) => (
  <div className="space-y-4">
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
      <h5 className="text-xs font-bold text-slate-700 uppercase">특이사항</h5>
      <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
        {student.specialNotes || '등록된 특이사항이 없습니다.'}
      </p>
    </div>

    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
      <h5 className="text-xs font-bold text-slate-700 uppercase">학원 내부 메모</h5>
      <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
        {student.memo || '등록된 내부 메모가 없습니다.'}
      </p>
    </div>
  </div>
);
