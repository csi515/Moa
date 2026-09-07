import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DoorOpen, Home, LogOut, Ticket, UserRound } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthProvider';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { StorageHydrator } from '@/StorageHydrator';
import { LoadingScreen } from '@/shared/components/LoadingScreen';
import {
  fetchStudentPortalContext,
  getMyPassSummary,
  type StudentPortalContext,
  type StudentPortalEnrollment,
} from './services/studentPortalService';
import { CustomerPracticeRoomView } from './CustomerPracticeRoomView';
import { CustomerHomeView } from './CustomerHomeView';

type CustomerTab = 'home' | 'practice' | 'account';

/**
 * 성인 수강생(본인) 포털 셸.
 * 보호자 연동 없이 customer/member 역할로 출석·이용권·연습실을 관리한다.
 */
export const CustomerShell: React.FC = () => {
  const { signOut, user } = useAuth();
  const { exitCustomerPortal, isCustomerOnly, currentOrganization } = useOrganization();
  const [ctx, setCtx] = useState<StudentPortalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<StudentPortalEnrollment | null>(null);
  const [tab, setTab] = useState<CustomerTab>('home');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchStudentPortalContext();
      setCtx(next);
      setEnrollment((prev) => {
        if (prev && next.enrollments.some((e) => e.enrollmentId === prev.enrollmentId)) {
          return next.enrollments.find((e) => e.enrollmentId === prev.enrollmentId) || prev;
        }
        return next.enrollments[0] || null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '포털을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen message="수강생 포털 준비 중..." />;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-rose-600">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl min-h-[44px]"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!ctx?.student || !enrollment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-slate-50">
        <UserRound className="w-10 h-10 text-slate-300" />
        <div>
          <h1 className="text-lg font-black text-slate-900">연결된 수강 정보가 없습니다</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            학원 가입 신청이 승인되면 여기에서 출석·이용권·연습실을 확인할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl min-h-[44px]"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <StorageHydrator
      key={enrollment.organizationId}
      organizationId={enrollment.organizationId}
      industryType={enrollment.industryType}
    >
      <CustomerPortalBody
        displayName={ctx.student.displayName}
        email={user?.email || ''}
        enrollment={enrollment}
        enrollments={ctx.enrollments}
        onSelectEnrollment={setEnrollment}
        tab={tab}
        onTabChange={setTab}
        onExit={() => {
          if (!isCustomerOnly) exitCustomerPortal();
        }}
        canExit={!isCustomerOnly}
        onSignOut={() => void signOut()}
        orgName={currentOrganization?.name || enrollment.organizationName}
      />
    </StorageHydrator>
  );
};

function CustomerPortalBody({
  displayName,
  email,
  enrollment,
  enrollments,
  onSelectEnrollment,
  tab,
  onTabChange,
  onExit,
  canExit,
  onSignOut,
  orgName,
}: {
  displayName: string;
  email: string;
  enrollment: StudentPortalEnrollment;
  enrollments: StudentPortalEnrollment[];
  onSelectEnrollment: (e: StudentPortalEnrollment) => void;
  tab: CustomerTab;
  onTabChange: (t: CustomerTab) => void;
  onExit: () => void;
  canExit: boolean;
  onSignOut: () => void;
  orgName: string;
}) {
  const passSummary = useMemo(
    () => getMyPassSummary(enrollment.customerId),
    [enrollment.customerId]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-bold text-indigo-600">{orgName}</p>
          <h1 className="text-base font-black text-slate-900">{displayName}</h1>
          {enrollments.length > 1 && (
            <select
              value={enrollment.enrollmentId}
              onChange={(e) => {
                const next = enrollments.find((x) => x.enrollmentId === e.target.value);
                if (next) onSelectEnrollment(next);
              }}
              className="mt-2 w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
            >
              {enrollments.map((e) => (
                <option key={e.enrollmentId} value={e.enrollmentId}>
                  {e.organizationName}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 pb-24">
        {tab === 'home' && (
          <CustomerHomeView
            customerId={enrollment.customerId}
            studentId={enrollment.customerId}
            organizationId={enrollment.organizationId}
            passSummary={passSummary}
          />
        )}
        {tab === 'practice' && (
          <CustomerPracticeRoomView organizationId={enrollment.organizationId} />
        )}
        {tab === 'account' && (
          <div className="space-y-3 bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-slate-900">계정</p>
            <p className="text-xs text-slate-500">{email}</p>
            {canExit && (
              <button
                type="button"
                onClick={onExit}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
              >
                관리 화면으로
              </button>
            )}
            <button
              type="button"
              onClick={onSignOut}
              className="w-full min-h-[44px] rounded-xl bg-slate-900 text-white text-sm font-bold inline-flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-1 py-1 flex justify-around z-40">
        {(
          [
            { id: 'home' as const, label: '홈', icon: Home },
            { id: 'practice' as const, label: '연습실', icon: DoorOpen },
            { id: 'account' as const, label: '계정', icon: Ticket },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={`flex flex-col items-center py-1 px-2 min-h-[44px] flex-1 text-[10px] ${
              tab === t.id ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <t.icon className="w-5 h-5" />
            <span className="mt-0.5">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
