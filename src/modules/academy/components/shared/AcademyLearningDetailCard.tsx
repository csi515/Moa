import React, { ReactNode } from 'react';

interface Props {
  subjectLabel: string;
  title: string;
  meta: string;
  description?: string;
  aside?: ReactNode;
}

/** 숙제·시험 상세 요약 카드 */
export const AcademyLearningDetailCard: React.FC<Props> = ({
  subjectLabel,
  title,
  meta,
  description,
  aside,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div>
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{subjectLabel}</p>
        <h3 className="text-lg font-bold text-slate-900 mt-0.5">{title}</h3>
        <p className="text-xs text-slate-500 mt-1">{meta}</p>
        {description && <p className="text-sm text-slate-600 mt-2">{description}</p>}
      </div>
      {aside}
    </div>
  </div>
);
