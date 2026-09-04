import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  ChevronRight,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { useOrganization } from './OrganizationProvider';
import { getRoleLabel } from './services/organizationService';
import { getIndustryLabel, type IndustryType } from '../industry/types';
import { CreateOrganizationWizard } from './CreateOrganizationWizard';
import { TeacherJoinFlow } from './components/TeacherJoinFlow';
import { useAuth } from '../auth/AuthProvider';

export const OrganizationSelector: React.FC = () => {
  const { organizations, selectOrganization, loading } = useOrganization();
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [showTeacherFlow, setShowTeacherFlow] = useState(false);

  useEffect(() => {
    if (!loading && organizations.length === 0 && user?.user_metadata?.account_type === 'teacher') {
      setShowTeacherFlow(true);
    }
  }, [loading, organizations.length, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (showTeacherFlow) {
    return <TeacherJoinFlow />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl text-white shadow-lg mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">학원 선택</h1>
          <p className="text-sm text-slate-500 mt-2">
            관리할 학원을 선택하거나 새로 등록하세요
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 space-y-4">
          {organizations.length > 0 && (
            <>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                내 학원 ({organizations.length})
              </p>
              <div className="space-y-2">
                {organizations.map((membership) => (
                  <button
                    key={membership.id}
                    onClick={() => selectOrganization(membership.organizationId)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors text-left min-h-[44px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {membership.organization.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {getIndustryLabel(membership.organization.industry_type as IndustryType)} ·{' '}
                          {getRoleLabel(membership.role)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-slate-400">또는</span>
                </div>
              </div>
            </>
          )}

          <button
            onClick={() => setShowWizard(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-700 font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-colors min-h-[44px]"
          >
            <Plus className="w-5 h-5" />
            새 학원 등록하기
          </button>

          {organizations.length === 0 && (
            <button
              onClick={() => setShowTeacherFlow(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-emerald-200 rounded-2xl text-emerald-700 font-bold hover:bg-emerald-50 hover:border-emerald-300 transition-colors min-h-[44px]"
            >
              <GraduationCap className="w-5 h-5" />
              기존 학원에 강사로 가입하기
            </button>
          )}
        </div>
      </div>

      {showWizard && (
        <CreateOrganizationWizard
          onComplete={() => setShowWizard(false)}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  );
};
