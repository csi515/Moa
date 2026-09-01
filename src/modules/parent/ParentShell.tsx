import React, { useEffect, useState } from 'react';
import { ArrowLeft, Camera, Loader2, LogOut, Link2, UserPlus } from 'lucide-react';
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
import { ParentAddChildModal } from './ParentAddChildModal';
import { ParentLinkConsentModal } from './ParentLinkConsentModal';
import { GuardianLinkQrScanner } from './components/GuardianLinkQrScanner';

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
  const [showAddChild, setShowAddChild] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);

  const runRedeem = async (token: string) => {
    setRedeeming(true);
    try {
      const result = await redeemGuardianLinkToken(token);
      const mergeNote =
        result.mergedDuplicates && result.mergedDuplicates > 0
          ? ' (기존 자녀 정보와 통합됨)'
          : '';
      showToast(`${result.organizationName} · ${result.studentName} 연결 완료${mergeNote}`, 'success');
      setLinkInput('');
      setShowLinkForm(false);
      await refreshPortalTree();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '연결 코드가 유효하지 않습니다.', 'error');
    } finally {
      setRedeeming(false);
      setPendingToken(null);
      setShowConsent(false);
    }
  };

  const requestRedeem = (token: string) => {
    const code = token.trim().toUpperCase();
    if (!code) return;
    setPendingToken(code);
    setShowConsent(true);
  };

  useEffect(() => {
    const urlToken = parseGuardianLinkFromUrl();
    if (urlToken) storePendingGuardianLink(urlToken);

    const pending = consumePendingGuardianLink();
    if (!pending) return;

    requestRedeem(pending);
  }, []);

  const handleManualRedeem = () => {
    requestRedeem(linkInput);
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

        {step === 'children' && (
          <div className="mb-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowAddChild(true)}
              className="w-full py-2.5 bg-white border border-indigo-200 text-indigo-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
            >
              <UserPlus className="w-4 h-4" />
              내 자녀 등록
            </button>

            <div className="bg-white rounded-2xl p-4 border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-2">
                <Link2 className="w-4 h-4" />
                학원 연결 코드
              </div>
              {!showLinkForm ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLinkForm(true)}
                    className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl min-h-[44px]"
                  >
                    코드 입력하기
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQrScanner(true)}
                    className="px-4 py-2.5 bg-white border border-indigo-200 text-indigo-700 text-sm font-bold rounded-xl min-h-[44px] flex items-center justify-center gap-1"
                    aria-label="QR 스캔"
                  >
                    <Camera className="w-4 h-4" />
                    QR
                  </button>
                </div>
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
                    onClick={handleManualRedeem}
                    disabled={redeeming || linkInput.length < 6}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl min-h-[44px] disabled:opacity-50"
                  >
                    연결
                  </button>
                </div>
              )}
              {childCount === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  자녀를 먼저 등록하거나, 학원에서 받은 코드로 바로 연결할 수 있습니다.
                </p>
              )}
            </div>
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

      <ParentAddChildModal
        isOpen={showAddChild}
        onClose={() => setShowAddChild(false)}
        onSuccess={(message) => {
          showToast(message, 'success');
          void refreshPortalTree();
        }}
      />

      <ParentLinkConsentModal
        isOpen={showConsent}
        onConfirm={() => {
          if (pendingToken) void runRedeem(pendingToken);
        }}
        onCancel={() => {
          setPendingToken(null);
          setShowConsent(false);
        }}
      />

      <GuardianLinkQrScanner
        isOpen={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onScan={(token) => requestRedeem(token)}
      />
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
