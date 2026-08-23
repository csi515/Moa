import React from 'react';
import type { Student } from '@/types';

interface Props {
  student: Student;
}

export const AcademyStudentInfo: React.FC<Props> = ({ student }) => (
  <div>
    <p className="font-bold text-slate-900">{student.name}</p>
    <p className="text-xs text-slate-500">{student.grade || student.level}</p>
  </div>
);
