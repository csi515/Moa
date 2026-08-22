import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useParentScope } from '@/hooks';
import { Header, ToastContainer, ConfirmDialog } from '@/shared/components';
import { SupabaseRoleSync } from '@/SupabaseRoleSync';
import { isSupabaseConfigured } from '@/lib/supabase';
import { ParentAcademyPortal } from './ParentAcademyPortal';

/** 레거시: org 선택 후 학부모 역할 진입 (IndustryAppRouter) */
export const ParentAppContent: React.FC = () => {
  const { myStudents } = useParentScope();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(myStudents[0]?.id || '');

  useEffect(() => {
    if (myStudents.length > 0 && !myStudents.find((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(myStudents[0].id);
    }
  }, [myStudents, selectedStudentId]);

  const selectedStudent = myStudents.find((s) => s.id === selectedStudentId) || myStudents[0];

  if (!selectedStudent) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        {isSupabaseConfigured() && <SupabaseRoleSync />}
        <Header />
        <div className="max-w-3xl mx-auto p-4">
          <div className="bg-white rounded-2xl p-8 text-center text-slate-500">
            연결된 자녀 정보가 없습니다. 학원에 문의해 주세요.
          </div>
        </div>
        <ToastContainer />
        <ConfirmDialog />
      </div>
    );
  }

  return (
    <ParentAcademyPortal
      student={selectedStudent}
      organizationName="학원"
    />
  );
};
