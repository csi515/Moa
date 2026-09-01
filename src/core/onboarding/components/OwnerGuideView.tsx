import type { FC } from 'react';
import { BookOpen, CheckCircle2, ExternalLink } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { NavTab } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useStorageRefresh } from '@/hooks';
import { getIndustryFeatureGuide } from '@/core/help/featureGuides';
import { PageHeader } from '@/shared/components';
import {
  countCompletedSteps,
  getOwnerWorkflowSteps,
  isGuideTabUsed,
} from '../ownerGuideProgress';
import { OwnerGuideStepCard } from './OwnerGuideStepCard';

/** 사업주용 사용 가이드 전체 화면 */
export const OwnerGuideView: FC = () => {
  const { setActiveTab } = useApp();
  const { industry, allowedTabs } = usePermissions();
  useStorageRefresh();

  const workflowSteps = getOwnerWorkflowSteps(industry, allowedTabs);
  const { completed, total } = countCompletedSteps(workflowSteps);
  const { intro, sections } = getIndustryFeatureGuide(industry);

  const allowedSet = new Set(allowedTabs);
  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (allowedSet.has(item.id as NavTab)) return true;
        if (item.id === 'attendance' && allowedSet.has('attendance')) return true;
        if (item.id === 'parent-portal-care') return industry === 'daycare';
        return false;
      }),
    }))
    .filter((section) => section.items.length > 0);

  const navigate = (tab: string) => {
    if (allowedSet.has(tab as NavTab)) {
      setActiveTab(tab as NavTab);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        icon={<BookOpen className="w-6 h-6" />}
        iconClassName="text-indigo-600"
        title="사용 가이드"
        description="모아 — 모든 운영을 한곳에. 업무 흐름과 기능별 활용법을 안내합니다."
      />

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5">
        <h2 className="text-sm font-black text-slate-900">{intro.title}</h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{intro.body}</p>
        <p className="text-xs font-bold text-indigo-700 mt-3">
          핵심 업무 {completed}/{total}단계 완료
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          추천 업무 순서
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {workflowSteps.map((step) => (
            <OwnerGuideStepCard
              key={step.id}
              step={step}
              onAction={() => navigate(step.tab)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          기능별 활용 가이드
        </h2>
        <div className="space-y-4">
          {filteredSections.map((section) => (
            <div
              key={section.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                <h3 className="text-sm font-black text-slate-900">{section.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
              </div>
              <ul className="divide-y divide-slate-50">
                {section.items.map((item) => {
                  const canNavigate = allowedSet.has(item.id as NavTab);
                  const used = canNavigate && isGuideTabUsed(item.id as NavTab);
                  return (
                    <li key={item.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-900">{item.title}</p>
                            {used && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                사용함
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {item.summary}
                          </p>
                          {item.howTo && (
                            <p className="text-[11px] text-indigo-700 mt-2 bg-indigo-50 rounded-lg px-2.5 py-2 leading-relaxed">
                              활용 팁: {item.howTo}
                            </p>
                          )}
                        </div>
                        {canNavigate && (
                          <button
                            type="button"
                            onClick={() => navigate(item.id)}
                            className="shrink-0 inline-flex items-center gap-1 px-3 py-2 min-h-[44px] text-xs font-bold text-indigo-700 border border-indigo-200 rounded-xl hover:bg-indigo-50"
                          >
                            열기
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
