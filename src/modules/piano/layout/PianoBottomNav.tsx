import React, { useState } from 'react';
import { useApp, NavTab } from '@/context/AppContext';
import { useModuleLabels } from '@/modules/piano';
import { usePermissions } from '@/core/auth/usePermissions';
import { filterNavTabs } from '@/core/auth/navUtils';
import {
  LayoutDashboard,
  Users,
  Clock,
  CheckSquare,
  MoreHorizontal,
  CreditCard,
  Receipt,
  UserSquare2,
  GraduationCap,
  Piano,
  BookOpen,
  BookOpenCheck,
  MessageSquareText,
  Music2,
  Calendar,
  Settings,
  AlertCircle,
  Sparkles,
  Award,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PianoBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setSelectedStudentId } = useApp();
  const labels = useModuleLabels();
  const { allowedTabs } = usePermissions();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const mainTabs = filterNavTabs(
    [
    { tab: 'dashboard', label: '대시보드', icon: <LayoutDashboard className="w-5 h-5" /> },
    { tab: 'students', label: labels.customer.singular, icon: <Users className="w-5 h-5" /> },
    { tab: 'timetable', label: labels.schedule.singular, icon: <Clock className="w-5 h-5" /> },
    { tab: 'attendance', label: '출결', icon: <CheckSquare className="w-5 h-5" /> },
  ],
    allowedTabs
  );

  const moreTabs = filterNavTabs(
    [
    { tab: 'tuition', label: '수강료/수납', icon: <CreditCard className="w-5 h-5" /> },
    { tab: 'unpaid', label: '미납 통합', icon: <AlertCircle className="w-5 h-5" /> },
    { tab: 'makeups', label: '보강 수업', icon: <Sparkles className="w-5 h-5" /> },
    { tab: 'textbooks', label: '교재/재고 관리', icon: <BookOpen className="w-5 h-5" /> },
    { tab: 'expenses', label: '지출 관리', icon: <Receipt className="w-5 h-5" /> },
    { tab: 'parents', label: labels.contact.management, icon: <UserSquare2 className="w-5 h-5" /> },
    { tab: 'classes', label: labels.service.management, icon: <GraduationCap className="w-5 h-5" /> },
    { tab: 'lessons', label: '레슨 기록', icon: <Piano className="w-5 h-5" /> },
    { tab: 'practice', label: '연습 기록', icon: <BookOpenCheck className="w-5 h-5" /> },
    { tab: 'consultations', label: '상담 이력', icon: <MessageSquareText className="w-5 h-5" /> },
    { tab: 'resources', label: '교재/곡 자료실', icon: <Music2 className="w-5 h-5" /> },
    { tab: 'teachers', label: labels.staff.management, icon: <GraduationCap className="w-5 h-5" /> },
    { tab: 'calendar', label: '학원 캘린더', icon: <Calendar className="w-5 h-5" /> },
    { tab: 'recitals', label: '연주회·콩쿠르', icon: <Award className="w-5 h-5" /> },
    { tab: 'settings', label: '학원 설정', icon: <Settings className="w-5 h-5" /> },
  ],
    allowedTabs
  );

  if (mainTabs.length === 0 && moreTabs.length === 0) return null;

  const handleTabClick = (tab: NavTab) => {
    if (tab === 'students') setSelectedStudentId(null);
    setActiveTab(tab);
    setMoreMenuOpen(false);
  };

  const isMoreActive = moreTabs.some((t) => t.tab === activeTab);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around no-print">
        {mainTabs.map((item) => {
          const isActive = activeTab === item.tab && !moreMenuOpen;
          return (
            <button
              key={item.tab}
              onClick={() => handleTabClick(item.tab)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-indigo-600 font-bold scale-105' : 'text-slate-500 font-medium'
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* More Button — 추가 메뉴가 있을 때만 */}
        {moreTabs.length > 0 && (
        <button
          onClick={() => setMoreMenuOpen(!moreMenuOpen)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            moreMenuOpen || isMoreActive ? 'text-indigo-600 font-bold scale-105' : 'text-slate-500 font-medium'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">더보기</span>
        </button>
        )}
      </nav>

      {/* More Bottom Sheet */}
      <AnimatePresence>
        {moreMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto shadow-2xl border-t border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">전체 메뉴</h3>
                  <p className="text-xs text-slate-500">피아노학원 운영 메뉴를 선택하세요</p>
                </div>
                <button
                  onClick={() => setMoreMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
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
                      onClick={() => handleTabClick(item.tab)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`p-2 rounded-xl mb-1.5 ${isActive ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 shadow-xs'}`}>
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
};
