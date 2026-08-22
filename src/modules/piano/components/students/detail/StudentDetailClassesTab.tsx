import React from 'react';
import { ClassItem } from '@/types';

interface StudentDetailClassesTabProps {
  enrolledClasses: ClassItem[];
}

export const StudentDetailClassesTab: React.FC<StudentDetailClassesTabProps> = ({ enrolledClasses }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-bold text-slate-900">배정된 수강 반 목록</h4>
    </div>
    {enrolledClasses.length === 0 ? (
      <p className="text-xs text-slate-500 p-8 text-center bg-slate-50 rounded-2xl">
        배정된 반이 없습니다. 원생 정보를 수정하여 반을 배정하세요.
      </p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {enrolledClasses.map((cls) => (
          <div key={cls.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-sm text-slate-900">{cls.name}</h5>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                {cls.room}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              ⏰ 요일: <strong>{cls.daysOfWeek.join(', ')}</strong> | {cls.startTime} ~ {cls.endTime}
            </p>
            <p className="text-xs text-slate-500">
              선생님: {cls.teacherName} | 사용 교재: {cls.textbook || '-'}
            </p>
            {cls.memo && <p className="text-[11px] text-slate-400 bg-white p-2 rounded-lg">{cls.memo}</p>}
          </div>
        ))}
      </div>
    )}
  </div>
);
