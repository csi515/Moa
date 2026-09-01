import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, LogOut, Link2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/core/auth/AuthProvider';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { ParentPortalProvider, useParentPortal } from '@/core/parent/context/ParentPortalContext';
import {
  consumePendingGuardianLink,
  parseGuardianLinkFromUrl,
  redeemGuardianLinkToken,
  storePendingGuardianLink,
} from '@/core/parent/services/guardianLinkService';
import { LoadingScreen } from '@/shared/components/LoadingScreen';
import { StorageHydrator } from '@/StorageHydrator';
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
  const { loading, error, step, portalTree, refreshPortalTree } = useParentPortal();
  const { currentUser, showToast } = useApp();
  const { signOut } = useAuth();
  const { isParentOnly, exitParentPortal } = useOrganization();
  const [redeeming, setRedeeming] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);

  useEffect(() => {
    const urlToken = parseGuardianLinkFromUrl();
    if (urlToken) storePendingGuardianLink(urlToken);

    const pending = consumePendingGuardianLink();
    if (!pending) return;

    setRedeeming(true);
    void redeemGuardianLinkToken(pending)
      .then((result) => {
        showToast(`${result.organizationName} · ${result.studentName} 연결 완료`, 'success');
        return refreshPortalTree();
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : '연결 코드가 유효하지 않습니다.', 'error');
      })
      .finally(() => setRedeeming(false));
  }, [refreshPortalTree, showToast]);

  const handleManualRedeem = async () => {
    const code = linkInput.trim().toUpperCase();
    if (!code) return;
    setRedeeming(true);
    try {
      const result = await redeemGuardianLinkToken(code);
      showToast(`${result.organizationName} · ${result.studentName} 연결 완료`, 'success');
      setLinkInput('');
      setShowLinkForm(false);
      await refreshPortalTree();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '연결 코드가 유효하지 않습니다.', 'error');
    } finally {
      setRedeeming(false);
    }
  };

  if ((loading && !portalTree) || redeeming) {
    return <LoadingScreen message={redeeming ? '자녀 연결 중...' : '학부모 포털을 불러오는 중...'} />;
  }

  const childCount = portalTree?.children.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50">
      {step !== 'portal' && (
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
            {!isParentOnly && (
              <button
                type="button"
                onClick={exitParentPortal}
                className="p-2 rounded-xl hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600"
                aria-label="관리 화면으로"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500">학부모 포털</p>
              <h1 className="text-lg font-black text-slate-900 truncate">{currentUser.name}님</h1>
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

        {step === 'children' && childCount === 0 && (
          <div className="mb-4 bg-white rounded-2xl p-4 border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-2">
              <Link2 className="w-4 h-4" />
              학원 연결 코드
            </div>
            {!showLinkForm ? (
              <button
                type="button"
                onClick={() => setShowLinkForm(true)}
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl min-h-[44px]"
              >
                코드 입력하기
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value.toUpperCase())}
                  placeholder="8자리 코드"
                  maxLength={8}
                  className="flex-1 px-3 py-2 text-sm font-mono uppercase border border-slate-200 rounded-xl tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => void handleManualRedeem()}
                  disabled={redeeming || linkInput.length < 6}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl min-h-[44px] disabled:opacity-50"
                >
                  연결
                </button>
              </div>
            )}
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
        organizationId={selectedEnrollment.organizationId}
        organizationName={selectedEnrollment.organizationName}
        enrollmentStatus={selectedEnrollment.status}
        enrollmentLeftAt={selectedEnrollment.leftAt}
        industryType={selectedEnrollment.industryType}
        onBack={handleBack}
      />
    </StorageHydrator>
  );
}

function ParentPortalWithStudent({
  customerId,
  organizationId,
  organizationName,
  enrollmentStatus,
  enrollmentLeftAt,
  industryType,
  onBack,
}: {
  customerId: string;
  organizationId: string;
  organizationName: string;
  enrollmentStatus: import('@/core/parent/types/globalParent').EnrollmentStatus;
  enrollmentLeftAt?: string | null;
  industryType: string;
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
      organizationId={organizationId}
      organizationName={organizationName}
      enrollmentStatus={enrollmentStatus}
      enrollmentLeftAt={enrollmentLeftAt}
      industryType={industryType}
      onBack={onBack}
    />
  );
}
