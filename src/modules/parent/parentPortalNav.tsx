import React from 'react';
import {
  Home,
  CheckSquare,
  CreditCard,
  BookOpenCheck,
  Calendar,
  Megaphone,
  BookOpen,
  Pill,
  CalendarClock,
  CalendarDays,
} from 'lucide-react';
import type { IndustryType } from '@/core/industry/types';
import type { ParentPortalTab } from '@/types/education';

export type ParentPortalNavItem = {
  id: ParentPortalTab;
  label: string;
  icon: React.ReactNode;
};

const icon = (node: React.ReactNode) => node;

/** 업종별 학부모/보호자 하단 네비 */
export function getParentPortalNav(industry: IndustryType): ParentPortalNavItem[] {
  switch (industry) {
    case 'daycare':
      return [
        { id: 'home', label: '홈', icon: icon(<Home className="w-5 h-5" />) },
        { id: 'journals', label: '알림장', icon: icon(<BookOpen className="w-5 h-5" />) },
        { id: 'medications', label: '투약', icon: icon(<Pill className="w-5 h-5" />) },
        { id: 'notices', label: '안내', icon: icon(<Megaphone className="w-5 h-5" />) },
        { id: 'attendance', label: '등하원', icon: icon(<CheckSquare className="w-5 h-5" />) },
        { id: 'tuition', label: '보육료', icon: icon(<CreditCard className="w-5 h-5" />) },
      ];
    case 'gym':
      return [
        { id: 'home', label: '홈', icon: icon(<Home className="w-5 h-5" />) },
        { id: 'notices', label: '안내', icon: icon(<Megaphone className="w-5 h-5" />) },
        { id: 'schedule', label: '수업', icon: icon(<CalendarDays className="w-5 h-5" />) },
        { id: 'attendance', label: '출결', icon: icon(<CheckSquare className="w-5 h-5" />) },
        { id: 'events', label: '일정', icon: icon(<Calendar className="w-5 h-5" />) },
        { id: 'tuition', label: '수강료', icon: icon(<CreditCard className="w-5 h-5" />) },
      ];
    case 'pilates':
      return [
        { id: 'home', label: '홈', icon: icon(<Home className="w-5 h-5" />) },
        { id: 'notices', label: '안내', icon: icon(<Megaphone className="w-5 h-5" />) },
        { id: 'bookings', label: '예약', icon: icon(<CalendarClock className="w-5 h-5" />) },
        { id: 'tuition', label: '수강료', icon: icon(<CreditCard className="w-5 h-5" />) },
        { id: 'attendance', label: '출입', icon: icon(<CheckSquare className="w-5 h-5" />) },
      ];
    case 'piano':
    default:
      return [
        { id: 'home', label: '홈', icon: icon(<Home className="w-5 h-5" />) },
        { id: 'notices', label: '안내', icon: icon(<Megaphone className="w-5 h-5" />) },
        { id: 'schedule', label: '수업', icon: icon(<CalendarDays className="w-5 h-5" />) },
        { id: 'attendance', label: '출결', icon: icon(<CheckSquare className="w-5 h-5" />) },
        { id: 'tuition', label: '수납', icon: icon(<CreditCard className="w-5 h-5" />) },
        { id: 'assignments', label: '과제', icon: icon(<BookOpenCheck className="w-5 h-5" />) },
        { id: 'events', label: '행사', icon: icon(<Calendar className="w-5 h-5" />) },
      ];
  }
}

export function getParentPortalRoleLabel(industry: IndustryType): string {
  return industry === 'daycare' ? '보호자 포털' : '학부모 포털';
}

/** 하단 네비에는 없지만 홈에서 이동 가능한 탭 */
export function getParentPortalSecondaryTabs(industry: IndustryType): ParentPortalTab[] {
  if (industry === 'piano') return ['progress', 'reports'];
  return [];
}
