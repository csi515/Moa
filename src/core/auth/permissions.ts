import type { NavTab } from '@/context/AppContext';
import type { IndustryType } from '@/core/industry/types';
import type { UserRole } from '@/types';
import { isAttendanceModuleEnabled } from '@/core/attendance/features';
import { isProductModuleEnabled } from '@/core/products/features';
import type { AcademySettings } from '@/types';

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
const PILATES_STAFF_TABS: NavTab[] = ['dashboard', 'bookings', 'members', 'products'];

/** 피부샵 — 관리사 접근 가능 탭 */
const SKINCARE_STAFF_TABS: NavTab[] = [
  'dashboard',
  'bookings',
  'members',
  'care-programs',
  'consultations',
  'products',
];

/** 종합학원 — 강사 접근 가능 탭 */
const ACADEMY_STAFF_TABS: NavTab[] = [
  'dashboard',
  'students',
  'timetable',
  'attendance',
  'makeups',
  'homework',
  'exams',
  'consultations',
  'calendar',
];

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
  'products',
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
  'products',
  'members',
  'instructors',
  'settings',
];

/** 피부샵 — 관리자 탭 (재무 제외) */
const SKINCARE_ADMIN_TABS: NavTab[] = [
  'dashboard',
  'bookings',
  'services',
  'care-programs',
  'products',
  'members',
  'consultations',
  'instructors',
  'settings',
];

/** 종합학원 — 관리자 탭 (재무 제외) */
const ACADEMY_ADMIN_TABS: NavTab[] = [
  'dashboard',
  'students',
  'parents',
  'classes',
  'timetable',
  'attendance',
  'makeups',
  'homework',
  'exams',
  'consultations',
  'tuition',
  'unpaid',
  'products',
  'teachers',
  'calendar',
  'settings',
];

function resolveIndustryTabs(
  industry: IndustryType | string | null | undefined
): { admin: NavTab[]; staff: NavTab[] } {
  if (industry === 'pilates') {
    return { admin: PILATES_ADMIN_TABS, staff: PILATES_STAFF_TABS };
  }
  if (industry === 'skincare') {
    return { admin: SKINCARE_ADMIN_TABS, staff: SKINCARE_STAFF_TABS };
  }
  if (industry === 'academy') {
    return { admin: ACADEMY_ADMIN_TABS, staff: ACADEMY_STAFF_TABS };
  }
  return { admin: PIANO_ADMIN_TABS, staff: PIANO_STAFF_TABS };
}

function withFinanceTabs(base: NavTab[], role: UserRole | string | null | undefined): NavTab[] {
  if (!isOrgOwner(role)) return base;
  const merged = [...base];
  for (const tab of OWNER_FINANCE_TABS) {
    if (!merged.includes(tab)) merged.push(tab);
  }
  return merged;
}

function filterAttendanceTabs(tabs: NavTab[], attendanceEnabled: boolean): NavTab[] {
  if (attendanceEnabled) return tabs;
  return tabs.filter((t) => t !== 'attendance' && t !== 'makeups');
}

function filterProductTabs(tabs: NavTab[], productsEnabled: boolean): NavTab[] {
  if (productsEnabled) return tabs;
  return tabs.filter((t) => t !== 'products');
}

export function getAllowedTabs(
  role: UserRole | string | null | undefined,
  industry: IndustryType | string | null | undefined,
  settings?: AcademySettings | null
): NavTab[] {
  const { admin, staff } = resolveIndustryTabs(industry);
  const attendanceEnabled = isAttendanceModuleEnabled(settings, industry);
  const productsEnabled = isProductModuleEnabled(settings, industry);

  const applyFilters = (tabs: NavTab[]) =>
    filterProductTabs(filterAttendanceTabs(tabs, attendanceEnabled), productsEnabled);

  if (isOrgAdmin(role)) {
    return applyFilters(withFinanceTabs(admin, role));
  }

  if (isStaffRole(role)) {
    const staffMerged =
      industry === 'pilates' || industry === 'skincare' || industry === 'academy'
        ? staff
        : [...staff, ...PIANO_EDUCATION_TABS.filter((t) => !staff.includes(t))];
    return applyFilters(staffMerged);
  }

  if (isParentRole(role)) {
    return [];
  }

  return applyFilters(withFinanceTabs(admin, role));
}

export function canAccessTab(
  role: UserRole | string | null | undefined,
  industry: IndustryType | string | null | undefined,
  tab: NavTab,
  settings?: AcademySettings | null
): boolean {
  return getAllowedTabs(role, industry, settings).includes(tab);
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
