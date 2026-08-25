import { useState } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { NavTab } from '@/context/AppContext';
import type { NavMenuItem } from '@/core/auth/navUtils';
import type { ModuleTheme } from './moduleTheme';
import { MODULE_THEMES } from './moduleTheme';

interface ModuleBottomNavProps {
  mainTabs: NavMenuItem[];
  moreTabs: NavMenuItem[];
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  theme: ModuleTheme;
  moreMenuTitle?: string;
  moreMenuDescription?: string;
}

/** 모듈 공통 모바일 하단 네비 (메인 탭 + 더보기 시트) */
export function ModuleBottomNav({
  mainTabs,
  moreTabs,
  activeTab,
  onNavigate,
  theme,
  moreMenuTitle = '전체 메뉴',
  moreMenuDescription,
}: ModuleBottomNavProps) {
  const t = MODULE_THEMES[theme];
  const [moreOpen, setMoreOpen] = useState(false);

  if (mainTabs.length === 0 && moreTabs.length === 0) return null;

  const handleTab = (tab: NavTab) => {
    onNavigate(tab);
    setMoreOpen(false);
  };

  const isMoreActive = moreTabs.some((item) => item.tab === activeTab);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 flex items-center justify-around no-print safe-area-pb">
        {mainTabs.map((item) => {
          const isActive = activeTab === item.tab && !moreOpen;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => handleTab(item.tab)}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive ? `${t.bottomNavActive} scale-105` : 'text-slate-500 font-medium'
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {moreTabs.length > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
              moreOpen || isMoreActive
                ? `${t.bottomNavActive} scale-105`
                : 'text-slate-500 font-medium'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">더보기</span>
          </button>
        )}
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end"
            onClick={() => setMoreOpen(false)}
            role="presentation"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto shadow-2xl border-t border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{moreMenuTitle}</h3>
                  {moreMenuDescription && (
                    <p className="text-xs text-slate-500">{moreMenuDescription}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
                  aria-label="메뉴 닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pb-6">
                {moreTabs.map((item) => {
                  const isActive = activeTab === item.tab;
                  return (
                    <button
                      key={item.tab}
                      type="button"
                      onClick={() => handleTab(item.tab)}
                      className={`flex flex-col items-center justify-center min-h-[72px] p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                        isActive
                          ? `${t.bottomSheetActive} font-bold shadow-xs`
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl mb-1.5 ${
                          isActive ? t.bottomSheetActiveIcon : 'bg-white text-slate-700 shadow-xs'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <span className="text-xs">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
