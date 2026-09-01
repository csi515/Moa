import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh } from '@/hooks/useStorageRefresh';
import { StorageService } from '@/services/storage';
import { ToastContainer, ConfirmDialog } from '@/shared/components';
import { SupabaseRoleSync } from '@/SupabaseRoleSync';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  ENROLLMENT_STATUS_LABELS,
  type EnrollmentStatus,
} from '@/core/parent/types/globalParent';
import { normalizeIndustryType, type IndustryType } from '@/core/industry/types';
import type { Student } from '@/types';
import type { ParentPortalTab } from '@/types/education';
import { ParentPortalTabs } from './ParentPortalTabs';
import { getParentPortalNav, getParentPortalRoleLabel, getParentPortalSecondaryTabs } from './parentPortalNav';

export interface ParentAcademyPortalProps {
  student: Student;
  organizationId: string;
  organizationName: string;
  enrollmentStatus?: EnrollmentStatus;
  industryType?: IndustryType | string;
  onBack?: () => void;
}

export const ParentAcademyPortal: React.FC<ParentAcademyPortalProps> = ({
  student,
  organizationId,
  organizationName,
  enrollmentStatus = 'active',
  industryType: industryTypeProp,
  onBack,
}) => {
  const { currentUser, showToast, triggerRefresh } = useApp();
  const industryType = normalizeIndustryType(industryTypeProp);
  const portalNav = useMemo(() => getParentPortalNav(industryType), [industryType]);
  const allowedTabs = useMemo(
    () =>
      new Set([
        ...portalNav.map((t) => t.id),
        ...getParentPortalSecondaryTabs(industryType),
      ]),
    [portalNav, industryType]
  );

  const [activeTab, setActiveTab] = useState<ParentPortalTab>('home');

  useEffect(() => {
    if (!allowedTabs.has(activeTab)) {
      setActiveTab('home');
    }
  }, [allowedTabs, activeTab]);

  const statusLabel = ENROLLMENT_STATUS_LABELS[enrollmentStatus];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col">
      {isSupabaseConfigured() && <SupabaseRoleSync />}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="뒤로"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 truncate">{organizationName}</p>
            <h1 className="text-base font-black text-slate-900 truncate">{student.name}</h1>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
            {statusLabel}
          </span>
        </div>
      </header>

      <div className="flex-1 max-w-3xl w-full mx-auto p-4 pb-24">
        <div className="mb-4">
          <p className="text-xs text-slate-500">{getParentPortalRoleLabel(industryType)}</p>
          <p className="text-sm text-slate-600">안녕하세요, {currentUser.name}님</p>
        </div>

        <ParentPortalTabs
          tab={activeTab}
          student={student}
          organizationId={organizationId}
          showToast={showToast}
          onRefresh={triggerRefresh}
          onNavigate={setActiveTab}
          industryType={industryType}
        />
      </div>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-1 py-1 flex justify-around z-40">
        {portalNav.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex flex-col items-center py-1 px-1.5 text-[10px] min-w-0 min-h-[44px] ${
              activeTab === t.id ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            {t.icon}
            <span className="mt-0.5 truncate">{t.label}</span>
          </button>
        ))}
      </nav>

      <ToastContainer />
      <ConfirmDialog />
    </div>
  );
};

/** StorageHydrator 이후 customer_id로 Student 조회 */
export function useStudentFromEnrollment(customerId: string): Student | null {
  const refreshKey = useStorageRefresh();
  return useMemo(() => {
    return StorageService.getStudents().find((s) => s.id === customerId) ?? null;
  }, [customerId, refreshKey]);
}
