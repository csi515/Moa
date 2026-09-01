import type { FC } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useStorageRefresh } from '@/hooks';
import { countCompletedSteps, getOwnerWorkflowSteps } from '../ownerGuideProgress';
import { OwnerGuideStepCard } from './OwnerGuideStepCard';

/** 대시보드 상단 — 핵심 업무 흐름 카드 */
export const OwnerGuideDashboardSection: FC = () => {
  const { setActiveTab } = useApp();
  const { industry, allowedTabs, isAdmin } = usePermissions();
  useStorageRefresh();

  if (!isAdmin) return null;

  const steps = getOwnerWorkflowSteps(industry, allowedTabs);
  if (steps.length === 0) return null;

  const { completed, total } = countCompletedSteps(steps);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black text-slate-900">시작 가이드</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              등록부터 수납까지, 실제 업무 순서대로 안내합니다.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors shrink-0"
        >
          전체 사용 가이드
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
          <span>진행률</span>
          <span className="text-indigo-700">
            {completed}/{total}단계 ({progress}%)
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {steps.map((step) => (
          <OwnerGuideStepCard
            key={step.id}
            step={step}
            compact
            onAction={() => setActiveTab(step.tab)}
          />
        ))}
      </div>
    </section>
  );
};
