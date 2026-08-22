import type { NavTab } from '@/context/AppContext';
import type { IndustryType } from '@/core/industry/types';
import type { UserRole } from '@/types';

/** owner/admin/manager — 학원 운영 전체 메뉴 */
export function isOrgAdmin(role: UserRole | string | null | undefined): boolean {
  return role === 'owner' || role === 'admin' || role === 'manager';
}

/** 원장(owner) 역할 여부 */
export function isOrgOwner(role: UserRole | string | null | undefined): boolean {
  return role === 'owner';
}

/** staff(강사) 역할 여부 */
export function isStaffRole(role: UserRole | string | null | undefined): boolean {
  return role === 'staff';
}

/** parent(학부모) 역할 여부 */
export function isParentRole(role: UserRole | string | null | undefined): boolean {
  return role === 'parent';
}

/** 피아노 — 교육 품질 탭 (관리자·강사) */
const PIANO_EDUCATION_TABS: NavTab[] = ['curriculum', 'assignments', 'achievements', 'reports'];

/** 원장 전용 재무 탭 (모든 업종 공통) */
const OWNER_FINANCE_TABS: NavTab[] = ['finance', 'income', 'expenses'];

/** 피아노 — 강사 접근 가능 탭 */
const PIANO_STAFF_TABS: NavTab[] = [
  'dashboard',
  'students',
  'timetable',
  'attendance',
  'makeups',
  'lessons',
  'practice',
  'consultations',
  'calendar',
  'recitals',
  ...PIANO_EDUCATION_TABS,
];

/** 필라테스 — 강사 접근 가능 탭 */
const PILATES_STAFF_TABS: NavTab[] = ['dashboard', 'bookings', 'members'];

/** 피아노 — 관리자 탭 (재무 제외) */
const PIANO_ADMIN_TABS: NavTab[] = [
  'dashboard',
  'students',
  'parents',
  'classes',
  'timetable',
  'attendance',
  'makeups',
  'lessons',
  'practice',
  'consultations',
  'resources',
  'tuition',
  'unpaid',
  'textbooks',
  'teachers',
  'calendar',
  'recitals',
  'settings',
  ...PIANO_EDUCATION_TABS,
];

/** 필라테스 — 관리자 탭 (재무 제외) */
const PILATES_ADMIN_TABS: NavTab[] = [
  'dashboard',
  'bookings',
  'services',
  'members',
  'instructors',
  'settings',
];

function withFinanceTabs(base: NavTab[], role: UserRole | string | null | undefined): NavTab[] {
  if (!isOrgOwner(role)) return base;
  const merged = [...base];
  for (const tab of OWNER_FINANCE_TABS) {
    if (!merged.includes(tab)) merged.push(tab);
  }
  return merged;
}

export function getAllowedTabs(
  role: UserRole | string | null | undefined,
  industry: IndustryType | string | null | undefined
): NavTab[] {
  const industryType = industry === 'pilates' ? 'pilates' : 'piano';

  if (isOrgAdmin(role)) {
    const base = industryType === 'pilates' ? PILATES_ADMIN_TABS : PIANO_ADMIN_TABS;
    return withFinanceTabs(base, role);
  }

  if (isStaffRole(role)) {
    const staffTabs = industryType === 'pilates' ? PILATES_STAFF_TABS : PIANO_STAFF_TABS;
    return industryType === 'piano' ? [...staffTabs, ...PIANO_EDUCATION_TABS.filter((t) => !staffTabs.includes(t))] : staffTabs;
  }

  if (isParentRole(role)) {
    return [];
  }

  // role 미확정 시 기본 전체 접근 (localStorage 단독 모드)
  const base = industryType === 'pilates' ? PILATES_ADMIN_TABS : PIANO_ADMIN_TABS;
  return withFinanceTabs(base, role);
}

export function canAccessTab(
  role: UserRole | string | null | undefined,
  industry: IndustryType | string | null | undefined,
  tab: NavTab
): boolean {
  return getAllowedTabs(role, industry).includes(tab);
}

export function getDefaultTab(
  role: UserRole | string | null | undefined,
  industry: IndustryType | string | null | undefined
): NavTab {
  return 'dashboard';
}

/** 역할 표시 라벨 (UI용) */
export function getUserRoleLabel(role: UserRole | string | null | undefined): string {
  const labels: Record<UserRole, string> = {
    owner: '원장',
    admin: '관리자',
    manager: '매니저',
    staff: '강사',
    parent: '학부모',
  };
  if (!role || !(role in labels)) return '운영자';
  return labels[role as UserRole];
}

/** 역할별 아바타 이니셜 */
export function getUserRoleBadge(role: UserRole | string | null | undefined): string {
  const badges: Record<UserRole, string> = {
    owner: '원장',
    admin: '관리',
    manager: '매니저',
    staff: '강사',
    parent: '학부',
  };
  if (!role || !(role in badges)) return '운영';
  return badges[role as UserRole];
}
