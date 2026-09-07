import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, DoorOpen, Home, LogOut, User, UserRound } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthProvider';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { StorageHydrator } from '@/StorageHydrator';
import { LoadingScreen } from '@/shared/components/LoadingScreen';
import { isNativeApp } from '@/core/platform/capacitorPlatform';
import { isSupabaseConfigured } from '@/lib/supabase';
import { registerAppPush } from '@/core/push';
import { normalizeIndustryType } from '@/core/industry/types';
import type { CustomerJoinRequest } from '@/types';
import { customerJoinService } from './services/customerJoinService';
import {
  fetchStudentPortalContext,
  getMyPassSummary,
  type StudentPortalContext,
  type StudentPortalEnrollment,
} from './services/studentPortalService';
import { AdultStudentGuidePanel } from '@/core/help';
import { CustomerPracticeRoomView } from './CustomerPracticeRoomView';
import { CustomerHomeView } from './CustomerHomeView';
import { CustomerScheduleView } from './CustomerScheduleView';
import { CustomerAttendanceView } from './CustomerAttendanceView';
import { CustomerNoticesView } from './CustomerNoticesView';

type CustomerTab = 'home' | 'schedule' | 'attendance' | 'practice' | 'account';

function showPracticeTab(industryType: string): boolean {
  return normalizeIndustryType(industryType) === 'piano';
}

function getStatusLabel(status: string): { label: string; color: string } {
  const labels: Record<string, { label: string; color: string }> = {
    pending: { label: '승인 대기', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '승인 완료', color: 'bg-green-100 text-green-700' },
    rejected: { label: '반려됨', color: 'bg-red-100 text-red-700' },
    cancelled: { label: '취소됨', color: 'bg-slate-100 text-slate-700' },
  };
  return labels[status] || { label: status, color: 'bg-slate-100 text-slate-700' };
}

/**
 * 성인 수강생(본인) 포털 셸.
 * 보호자 연동 없이 customer/member 역할로 출석·이용권·연습실을 관리한다.
 */
export const CustomerShell: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { exitCustomerPortal, isCustomerOnly, currentOrganization } = useOrganization();
  const [ctx, setCtx] = useState<StudentPortalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<StudentPortalEnrollment | null>(null);
  const [tab, setTab] = useState<CustomerTab>('home');
  const [joinRequests, setJoinRequests] = useState<CustomerJoinRequest[]>([]);

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
      if (!next.student || next.enrollments.length === 0) {
        try {
          const requests = await customerJoinService.getMyJoinRequests();
          setJoinRequests(requests);
        } catch {
          setJoinRequests([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '포털을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isNativeApp() || !isSupabaseConfigured() || !user?.id) return;
    void registerAppPush({
      userId: user.id,
      organizationId: enrollment?.organizationId || currentOrganization?.id,
    });
  }, [user?.id, enrollment?.organizationId, currentOrganization?.id]);

  useEffect(() => {
    if (!enrollment) return;
    if (tab === 'practice' && !showPracticeTab(enrollment.industryType)) {
      setTab('home');
    }
  }, [enrollment, tab]);

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
    const pending = joinRequests.filter((r) => r.status === 'pending');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-slate-50 pb-safe">
        <UserRound className="w-10 h-10 text-slate-300" />
        <div>
          <h1 className="text-lg font-black text-slate-900">연결된 수강 정보가 없습니다</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            학원 가입 신청이 승인되면 여기에서 출석·이용권·연습실을 확인할 수 있습니다.
          </p>
        </div>

        {pending.length > 0 && (
          <div className="w-full max-w-sm space-y-2 text-left">
            <p className="text-xs font-bold text-slate-600">승인 대기 중</p>
            {pending.map((r) => {
              const status = getStatusLabel(r.status);
              return (
                <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {r.organization_name || r.applicant_name}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    신청일 {new Date(r.created_at).toLocaleDateString('ko-KR')}
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('이 가입 신청을 취소할까요?')) return;
                      try {
                        await customerJoinService.cancelMyJoinRequest(r.id);
                        await load();
                      } catch (err) {
                        alert(err instanceof Error ? err.message : '취소에 실패했습니다');
                      }
                    }}
                    className="mt-2 w-full py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl min-h-[44px]"
                  >
                    신청 취소
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full max-w-sm">
          <button
            type="button"
            onClick={() => navigate('/signup/customer', { state: { openPending: pending.length > 0 } })}
            className="w-full px-4 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl min-h-[44px]"
          >
            {pending.length > 0 ? '신청 현황·추가 신청' : '학원 가입 신청하기'}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="w-full px-4 py-2.5 text-sm font-bold text-indigo-600 border border-indigo-100 rounded-xl min-h-[44px]"
          >
            승인 여부 새로고침
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl min-h-[44px]"
          >
            로그아웃
          </button>
        </div>
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

  const withPractice = showPracticeTab(enrollment.industryType);
  const navItems = useMemo(
    () =>
      [
        { id: 'home' as const, label: '홈', icon: Home },
        { id: 'schedule' as const, label: '일정', icon: CalendarDays },
        { id: 'attendance' as const, label: '출결', icon: ClipboardCheck },
        ...(withPractice
          ? [{ id: 'practice' as const, label: '연습실', icon: DoorOpen }]
          : []),
        { id: 'account' as const, label: '계정', icon: User },
      ] as const,
    [withPractice]
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
            onOpenAttendance={() => onTabChange('attendance')}
            displayName={displayName}
          />
        )}
        {tab === 'schedule' && (
          <CustomerScheduleView
            customerId={enrollment.customerId}
            organizationId={enrollment.organizationId}
            displayName={displayName}
          />
        )}
        {tab === 'attendance' && (
          <CustomerAttendanceView
            customerId={enrollment.customerId}
            organizationId={enrollment.organizationId}
            industryType={enrollment.industryType}
            displayName={displayName}
          />
        )}
        {tab === 'practice' && withPractice && (
          <CustomerPracticeRoomView organizationId={enrollment.organizationId} />
        )}
        {tab === 'account' && (
          <div className="space-y-4">
            <CustomerNoticesView
              customerId={enrollment.customerId}
              organizationId={enrollment.organizationId}
              displayName={displayName}
            />
            <AdultStudentGuidePanel industry={enrollment.industryType} />
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
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-1 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] flex justify-around z-40">
        {navItems.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={`flex flex-col items-center py-1 px-1 min-h-[44px] flex-1 text-[10px] ${
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
}
