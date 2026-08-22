import React from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/core/auth/AuthProvider';
import { ParentPortalProvider, useParentPortal } from '@/core/parent/context/ParentPortalContext';
import { LoadingScreen } from '@/shared/components/LoadingScreen';
import { StorageHydrator } from '@/StorageHydrator';
import { normalizeIndustryType } from '@/core/industry/types';
import { ParentChildrenHome } from './ParentChildrenHome';
import { ParentAcademyPicker } from './ParentAcademyPicker';
import { ParentAcademyPortal, useStudentFromEnrollment } from './ParentAcademyPortal';

export const ParentShell: React.FC = () => {
  return (
    <ParentPortalProvider>
      <ParentShellContent />
    </ParentPortalProvider>
  );
};

function ParentShellContent() {
  const { loading, error, step, portalTree } = useParentPortal();
  const { currentUser } = useApp();
  const { signOut } = useAuth();

  if (loading && !portalTree) {
    return <LoadingScreen message="학부모 포털을 불러오는 중..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50">
      {step !== 'portal' && (
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">학부모 포털</p>
              <h1 className="text-lg font-black text-slate-900">{currentUser.name}님</h1>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="p-2 rounded-xl hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500"
              aria-label="로그아웃"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      <main className="max-w-lg mx-auto p-4 pb-8">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700">
            {error}
          </div>
        )}

        {step === 'children' && <ParentChildrenHome />}
        {step === 'academies' && <ParentAcademyPicker />}
        {step === 'portal' && <ParentPortalHydrated />}
      </main>

      {loading && portalTree && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-full p-2">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
        </div>
      )}
    </div>
  );
}

function ParentPortalHydrated() {
  const { selectedEnrollment, selectedStudent, goToAcademies, goToChildren } = useParentPortal();

  if (!selectedEnrollment || !selectedStudent) {
    return null;
  }

  const handleBack =
    selectedStudent.enrollments.length > 1 ? goToAcademies : goToChildren;

  return (
    <StorageHydrator
      organizationId={selectedEnrollment.organizationId}
      industryType={selectedEnrollment.industryType}
    >
      <ParentPortalWithStudent
        customerId={selectedEnrollment.customerId}
        organizationName={selectedEnrollment.organizationName}
        enrollmentStatus={selectedEnrollment.status}
        onBack={handleBack}
      />
    </StorageHydrator>
  );
}

function ParentPortalWithStudent({
  customerId,
  organizationName,
  enrollmentStatus,
  onBack,
}: {
  customerId: string;
  organizationName: string;
  enrollmentStatus: import('@/core/parent/types/globalParent').EnrollmentStatus;
  onBack: () => void;
}) {
  const student = useStudentFromEnrollment(customerId);

  if (!student) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200">
        학생 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </div>
    );
  }

  return (
    <ParentAcademyPortal
      student={student}
      organizationName={organizationName}
      enrollmentStatus={enrollmentStatus}
      onBack={onBack}
    />
  );
}
