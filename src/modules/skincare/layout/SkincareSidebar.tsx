import React from 'react';
import { useApp, NavTab } from '@/context/AppContext';
import { useModuleLabels } from '@/modules/skincare';
import { usePermissions } from '@/core/auth/usePermissions';
import { filterNavSections } from '@/core/auth/navUtils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Sparkles,
  Ticket,
  MessageSquareText,
  Activity,
  Settings,
  BarChart3,
  TrendingUp,
  Receipt,
} from 'lucide-react';

interface MenuItem {
  tab: NavTab;
  label: string;
  icon: React.ReactNode;
}

export const SkincareSidebar: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, setSelectedStudentId } = useApp();
  const labels = useModuleLabels();
  const { allowedTabs, roleLabel, roleBadge } = usePermissions();

  const menuSections = filterNavSections(
    [
      {
        title: '메인',
        items: [
          { tab: 'dashboard', label: '대시보드', icon: <LayoutDashboard className="w-4 h-4" /> },
        ],
      },
      {
        title: labels.schedule.section,
        items: [
          {
            tab: 'bookings',
            label: labels.schedule.management,
            icon: <Calendar className="w-4 h-4" />,
          },
          {
            tab: 'services',
            label: labels.service.management,
            icon: <Sparkles className="w-4 h-4" />,
          },
          {
            tab: 'care-programs',
            label: labels.careProgram.management,
            icon: <Ticket className="w-4 h-4" />,
          },
        ],
      },
      {
        title: labels.customer.section,
        items: [
          {
            tab: 'members',
            label: labels.customer.management,
            icon: <Users className="w-4 h-4" />,
          },
          {
            tab: 'consultations',
            label: '상담·피부 기록',
            icon: <MessageSquareText className="w-4 h-4" />,
          },
          {
            tab: 'instructors',
            label: labels.staff.management,
            icon: <Activity className="w-4 h-4" />,
          },
        ],
      },
      {
        title: '재무 관리',
        items: [
          { tab: 'finance', label: '재무 요약', icon: <BarChart3 className="w-4 h-4" /> },
          { tab: 'income', label: '수입 관리', icon: <TrendingUp className="w-4 h-4" /> },
          { tab: 'expenses', label: '지출 관리', icon: <Receipt className="w-4 h-4" /> },
        ],
      },
      {
        title: '설정',
        items: [{ tab: 'settings', label: '샵 설정', icon: <Settings className="w-4 h-4" /> }],
      },
    ],
    allowedTabs
  );

  const handleTabClick = (item: MenuItem) => {
    if (item.tab === 'members') setSelectedStudentId(null);
    setActiveTab(item.tab);
  };

  return (
    <aside className="hidden md:flex w-64 bg-white text-slate-600 flex-col h-[calc(100vh-65px)] sticky top-[65px] border-r border-slate-200 shrink-0 no-print">
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {section.title}
            </p>
            {section.items.map((item) => {
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => handleTabClick(item)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs transition-colors ${
                    isActive
                      ? 'bg-rose-50 text-rose-700 font-bold'
                      : 'text-slate-500 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className={isActive ? 'text-rose-600' : 'text-slate-400'}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="p-3.5 border-t border-slate-100">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80">
          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
            {roleBadge}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400">{roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
