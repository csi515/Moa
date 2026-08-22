import React from 'react';
import { useApp, NavTab } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  CalendarDays,
  Clock,
  CheckSquare,
  CreditCard,
  Receipt,
  MessageSquareText,
  BookOpenCheck,
  BookOpen,
  Piano,
  Music2,
  GraduationCap,
  Calendar,
  Bell,
  Settings,
  Sparkles,
  Lock,
  ShoppingBag
} from 'lucide-react';

interface MenuItem {
  tab: NavTab;
  label: string;
  icon: React.ReactNode;
  requiresDirector?: boolean;
  badge?: string | number;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, setSelectedStudentId } = useApp();
  const isDirector = currentUser.role === 'director';

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: '메인',
      items: [
        { tab: 'dashboard', label: '대시보드', icon: <LayoutDashboard className="w-4 h-4" /> }
      ]
    },
    {
      title: '원생 및 학부모',
      items: [
        { tab: 'students', label: '원생 관리', icon: <Users className="w-4 h-4" /> },
        { tab: 'parents', label: '학부모 관리', icon: <UserSquare2 className="w-4 h-4" /> }
      ]
    },
    {
      title: '수업 및 출결',
      items: [
        { tab: 'classes', label: '반/수업 관리', icon: <GraduationCap className="w-4 h-4" /> },
        { tab: 'timetable', label: '주간 시간표', icon: <Clock className="w-4 h-4" /> },
        { tab: 'attendance', label: '출결 관리', icon: <CheckSquare className="w-4 h-4" /> }
      ]
    },
    {
      title: '교육 및 일지',
      items: [
        { tab: 'lessons', label: '레슨 기록', icon: <Piano className="w-4 h-4" /> },
        { tab: 'practice', label: '연습 기록', icon: <BookOpenCheck className="w-4 h-4" /> },
        { tab: 'consultations', label: '상담 이력', icon: <MessageSquareText className="w-4 h-4" /> },
        { tab: 'resources', label: '교재 및 곡 관리', icon: <Music2 className="w-4 h-4" /> }
      ]
    },
    {
      title: '수납 및 회계',
      items: [
        { tab: 'tuition', label: '수강료 및 수납', icon: <CreditCard className="w-4 h-4" />, requiresDirector: true },
        { tab: 'textbooks', label: '교재 판매 및 교재비', icon: <BookOpen className="w-4 h-4" /> },
        { tab: 'expenses', label: '지출 관리', icon: <Receipt className="w-4 h-4" />, requiresDirector: true }
      ]
    },
    {
      title: '학원 운영',
      items: [
        { tab: 'teachers', label: '선생님 관리', icon: <GraduationCap className="w-4 h-4" />, requiresDirector: true },
        { tab: 'calendar', label: '학원 캘린더', icon: <Calendar className="w-4 h-4" /> },
        { tab: 'notifications', label: '알림 관리', icon: <Bell className="w-4 h-4" /> },
        { tab: 'settings', label: '학원 설정', icon: <Settings className="w-4 h-4" />, requiresDirector: true }
      ]
    }
  ];

  const handleTabClick = (item: MenuItem) => {
    if (item.requiresDirector && !isDirector) {
      alert('🔒 수납 및 회계 관리는 원장님(관리자) 전용 메뉴입니다. 상단 우측에서 원장 권한으로 전환하세요.');
      return;
    }
    if (item.tab === 'students') {
      setSelectedStudentId(null);
    }
    setActiveTab(item.tab);
  };

  return (
    <aside className="w-64 bg-white text-slate-600 flex flex-col h-[calc(100vh-65px)] sticky top-[65px] border-r border-slate-200 select-none shrink-0 no-print">
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
        {menuSections.map((section, sIdx) => {
          // If all items in section require director and user is teacher, hide section or show locked
          const visibleItems = section.items.filter((item) => !item.requiresDirector || isDirector);
          if (visibleItems.length === 0 && !isDirector) return null;

          return (
            <div key={sIdx} className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {section.title}
              </p>
              {section.items.map((item) => {
                const isActive = activeTab === item.tab;
                const isLocked = item.requiresDirector && !isDirector;

                if (isLocked) {
                  return null; // Keep sidebar clean for teacher role
                }

                return (
                  <button
                    key={item.tab}
                    id={`nav-${item.tab}`}
                    onClick={() => handleTabClick(item)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer / Quick Profile & Role Info */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                isDirector ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {isDirector ? '원장' : '강사'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-400">
                {isDirector ? '전체 관리자' : '레슨/출결 담당'}
              </p>
            </div>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
              isDirector
                ? 'bg-indigo-50 text-indigo-700'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {isDirector ? '원장' : '선생님'}
          </span>
        </div>
      </div>
    </aside>
  );
};
