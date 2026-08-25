import React, { useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import type { IndustryType } from '@/core/industry/types';
import { getIndustryFeatureGuide, type FeatureGuideSection } from '../featureGuides';

interface Props {
  industry: IndustryType;
}

const GuideSectionAccordion: React.FC<{ section: FeatureGuideSection }> = ({ section }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 min-h-[44px] text-left hover:bg-slate-50"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{section.title}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{section.description}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul className="border-t border-slate-100 divide-y divide-slate-50 px-4 py-1">
          {section.items.map((item) => (
            <li key={item.id} className="py-3">
              <p className="text-xs font-bold text-slate-800">{item.title}</p>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{item.summary}</p>
              {item.howTo && (
                <p className="text-[11px] text-indigo-700 mt-1.5 bg-indigo-50 rounded-lg px-2 py-1.5 leading-relaxed">
                  사용 팁: {item.howTo}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/** 업종별 기능 설명서 (사업주용) */
export const IndustryFeatureGuidePanel: React.FC<Props> = ({ industry }) => {
  const { intro, sections } = getIndustryFeatureGuide(industry);

  return (
    <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-black text-slate-900">{intro.title}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{intro.body}</p>
        </div>
      </div>

      <div className="space-y-2">
        {sections.map((section) => (
          <GuideSectionAccordion key={section.id} section={section} />
        ))}
      </div>
    </section>
  );
};
