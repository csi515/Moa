import React from 'react';
import { Student } from '@/types';

interface StudentDetailMemoTabProps {
  student: Student;
}

/** 활동 탭 — 특이사항·내부 메모 (기존 memo 기능) */
export const StudentDetailMemoTab: React.FC<StudentDetailMemoTabProps> = ({ student }) => (
  <div className="space-y-4">
    <p className="text-xs text-slate-500">
      원생 관련 특이사항과 학원 내부 메모입니다. 연습·연주영상은 더보기 탭에서 확인하세요.
    </p>

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
