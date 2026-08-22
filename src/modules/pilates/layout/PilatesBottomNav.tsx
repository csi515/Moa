import React, { useState } from 'react';
import { useApp, NavTab } from '@/context/AppContext';
import { useModuleLabels } from '@/modules/pilates';
import { LayoutDashboard, Calendar, Users, MoreHorizontal, Dumbbell, Activity, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PilatesBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setSelectedStudentId } = useApp();
  const labels = useModuleLabels();
  const [moreOpen, setMoreOpen] = useState(false);

  const mainTabs: { tab: NavTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'dashboard', label: '홈', icon: <LayoutDashboard className="w-5 h-5" /> },
    { tab: 'bookings', label: '예약', icon: <Calendar className="w-5 h-5" /> },
    { tab: 'members', label: labels.customer.singular, icon: <Users className="w-5 h-5" /> },
  ];

  const moreTabs: { tab: NavTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'services', label: '수업 종류', icon: <Dumbbell className="w-5 h-5" /> },
    { tab: 'instructors', label: '강사', icon: <Activity className="w-5 h-5" /> },
    { tab: 'settings', label: '설정', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleTab = (tab: NavTab) => {
    if (tab === 'members') setSelectedStudentId(null);
    setActiveTab(tab);
    setMoreOpen(false);
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-slate-200 px-2 py-1.5 flex justify-around no-print">
        {mainTabs.map((item) => (
          <button
            key={item.tab}
            onClick={() => handleTab(item.tab)}
            className={`flex flex-col items-center py-1 px-3 text-[10px] ${activeTab === item.tab && !moreOpen ? 'text-teal-600 font-bold' : 'text-slate-500'}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-col items-center py-1 px-3 text-[10px] ${moreOpen ? 'text-teal-600 font-bold' : 'text-slate-500'}`}
        >
          <MoreHorizontal className="w-5 h-5" />
          더보기
        </button>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 flex flex-col justify-end">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white rounded-t-3xl p-5">
              <div className="flex justify-between mb-4">
                <h3 className="font-bold">전체 메뉴</h3>
                <button onClick={() => setMoreOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-3 gap-3 pb-6">
                {moreTabs.map((item) => (
                  <button key={item.tab} onClick={() => handleTab(item.tab)} className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 text-xs">
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
