import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { StorageService } from '@/services/storage';
import {
  getOwnerWorkflowSteps,
  saveOwnerGuideSettings,
} from '../ownerGuideProgress';
import type { OwnerGuideStepStatus } from '../types';

interface OwnerGuideWizardProps {
  onComplete: () => void;
}

/** 첫 로그인 시 단계별 업무 흐름 안내 */
export const OwnerGuideWizard: React.FC<OwnerGuideWizardProps> = ({ onComplete }) => {
  const { setActiveTab, triggerRefresh } = useApp();
  const { industry, allowedTabs, settings } = usePermissions();
  const steps = useMemo(
    () => getOwnerWorkflowSteps(industry, allowedTabs),
    [industry, allowedTabs]
  );
  const [index, setIndex] = useState(0);

  if (steps.length === 0) return null;

  const step = steps[Math.min(index, steps.length - 1)] as OwnerGuideStepStatus;
  const isLast = index >= steps.length - 1;

  const finish = (skipped = false) => {
    StorageService.updateSettings(
      saveOwnerGuideSettings(
        skipped ? { wizardSkipped: true } : { wizardCompleted: true },
        settings
      )
    );
    triggerRefresh();
    onComplete();
  };

  const goToFeature = () => {
    finish(false);
    setActiveTab(step.tab);
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900">모아 시작 가이드</h2>
          </div>
          <button
            type="button"
            onClick={() => finish(true)}
            className="text-slate-400 hover:text-slate-600 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="건너뛰기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <React.Fragment key={s.id}>
                <div
                  className={`h-1.5 flex-1 rounded-full ${
                    i <= index ? 'bg-indigo-500' : 'bg-slate-200'
                  }`}
                />
              </React.Fragment>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-semibold">
            {index + 1} / {steps.length}단계
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">{step.title}</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{step.benefit}</p>
            {step.tip && (
              <p className="text-xs text-indigo-700 mt-3 bg-indigo-50 rounded-xl px-3 py-2 leading-relaxed">
                💡 {step.tip}
              </p>
            )}
            {step.completed && (
              <p className="text-xs font-bold text-emerald-700 mt-3">이미 사용한 기능입니다.</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex((prev) => prev - 1)}
                className="flex-1 py-3 min-h-[44px] rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                이전
              </button>
            )}
            <button
              type="button"
              onClick={goToFeature}
              className="flex-1 py-3 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold"
            >
              {step.completed ? '메뉴 열기' : '바로 시작하기'}
            </button>
            {!isLast && (
              <button
                type="button"
                onClick={() => setIndex((prev) => prev + 1)}
                className="flex-1 py-3 min-h-[44px] rounded-xl border border-indigo-200 text-indigo-700 text-sm font-bold hover:bg-indigo-50 inline-flex items-center justify-center gap-1"
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {isLast && (
              <button
                type="button"
                onClick={() => finish(false)}
                className="flex-1 py-3 min-h-[44px] rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                가이드 닫기
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => finish(true)}
            className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 min-h-[44px]"
          >
            나중에 보기
          </button>
        </div>
      </div>
    </div>
  );
};
