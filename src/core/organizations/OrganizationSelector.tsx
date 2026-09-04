import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  ChevronRight,
  Loader2,
  Piano,
  Sparkles,
  Activity,
  Dumbbell,
  Baby,
  GraduationCap,
} from 'lucide-react';
import { useOrganization } from './OrganizationProvider';
import { getRoleLabel } from './services/organizationService';
import { INDUSTRY_OPTIONS, getIndustryLabel, type IndustryType } from '../industry/types';
import { TeacherJoinFlow } from './components/TeacherJoinFlow';
import { useAuth } from '../auth/AuthProvider';

const INDUSTRY_ICONS: Record<IndustryType, React.ComponentType<{ className?: string }>> = {
  piano: Piano,
  pilates: Activity,
  gym: Dumbbell,
  daycare: Baby,
};

export const OrganizationSelector: React.FC = () => {
  const { organizations, selectOrganization, createOrganization, loading } =
    useOrganization();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showTeacherFlow, setShowTeacherFlow] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [industryType, setIndustryType] = useState<IndustryType>('piano');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && organizations.length === 0 && user?.user_metadata?.accountType === 'teacher') {
      setShowTeacherFlow(true);
    }
  }, [loading, organizations.length, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setError('학원 이름을 입력해 주세요');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await createOrganization(orgName.trim(), industryType);
    } catch (err) {
      setError(err instanceof Error ? err.message : '학원 등록에 실패했습니다. 다시 시도해 주세요');
    } finally {
      setCreating(false);
    }
  };

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
          {organizations.length > 0 && !showCreate && (
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

          {!showCreate ? (
            <>
              <button
                onClick={() => setShowCreate(true)}
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
            </>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-700">
                <Sparkles className="w-4 h-4" />
                새 학원 등록
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  학원/업체 이름
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="하모니 피아노 음악학원"
                  autoFocus
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">업종</label>
                <div className="grid grid-cols-1 gap-2">
                  {INDUSTRY_OPTIONS.map((opt) => {
                    const Icon = INDUSTRY_ICONS[opt.value];
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setIndustryType(opt.value)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left min-h-[44px] ${
                          industryType === opt.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <div>
                          <span className="text-sm font-bold block">{opt.label}</span>
                          <span className="text-[11px] text-slate-500">{opt.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                {organizations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setError(null);
                    }}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 min-h-[44px]"
                  >
                    취소
                  </button>
                )}
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  만들기
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
