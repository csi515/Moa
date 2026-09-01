import type { FC } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import type { OwnerGuideStepStatus } from '../types';

interface OwnerGuideStepCardProps {
  step: OwnerGuideStepStatus;
  onAction: () => void;
  compact?: boolean;
}

export const OwnerGuideStepCard: FC<OwnerGuideStepCardProps> = ({
  step,
  onAction,
  compact = false,
}) => (
  <button
    type="button"
    onClick={onAction}
    className={`text-left w-full rounded-2xl border transition-colors min-h-[44px] ${
      step.completed
        ? 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50'
        : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
    } ${compact ? 'p-3' : 'p-4'}`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
          step.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
        }`}
      >
        {step.completed ? <CheckCircle2 className="w-4 h-4" /> : step.stepNumber}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-900">{step.title}</p>
          {!compact && (
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </div>
        <p className={`text-slate-600 mt-1 leading-relaxed ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {step.benefit}
        </p>
        {step.completed && (
          <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            완료
          </span>
        )}
      </div>
    </div>
  </button>
);
