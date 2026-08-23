import React from 'react';
import { useApp, NavTab } from '@/context/AppContext';
import type { NavMenuSection } from '@/core/auth/navUtils';
import { MODULE_THEMES, type ModuleTheme } from './moduleTheme';

const LIST_TABS: NavTab[] = ['students', 'members'];

interface Props {
  sections: NavMenuSection[];
  roleBadge: string;
  roleLabel: string;
  theme?: ModuleTheme;
}

/** 업종별 사이드바 공통 렌더러 (권한 필터는 호출부에서 적용) */
export const ModuleSidebar: React.FC<Props> = ({
  sections,
  roleBadge,
  roleLabel,
  theme = 'indigo',
}) => {
  const { activeTab, setActiveTab, currentUser, setSelectedStudentId } = useApp();
  const t = MODULE_THEMES[theme];

  const handleTabClick = (tab: NavTab) => {
    if (LIST_TABS.includes(tab)) setSelectedStudentId(null);
    setActiveTab(tab);
  };

  return (
    <aside className="hidden md:flex w-64 bg-white text-slate-600 flex-col h-[calc(100vh-65px)] sticky top-[65px] border-r border-slate-200 select-none shrink-0 no-print">
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {section.title}
            </p>
            {section.items.map((item) => {
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  id={`nav-${item.tab}`}
                  type="button"
                  onClick={() => handleTabClick(item.tab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? t.sidebarActive
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? t.sidebarActiveIcon : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${t.sidebarBadge}`}
          >
            {roleBadge}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400">{roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
