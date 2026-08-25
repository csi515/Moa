import type { NavTab } from '@/context/AppContext';
import type { IndustryType } from '@/core/industry/types';
import { normalizeIndustryType } from '@/core/industry/types';
import type { UserRole } from '@/types';
import { isAttendanceModuleEnabled } from '@/core/attendance/features';
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

/** 출입(PIN) 탭 — 사업장 설정으로 on/off */
const ATTENDANCE_PIN_TAB: NavTab = 'attendance';

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
const PILATES_STAFF_TABS: NavTab[] = ['dashboard', 'bookings', 'members', 'attendance'];

/** 체육관 — 강사 접근 가능 탭 */
const GYM_STAFF_TABS: NavTab[] = [
  'dashboard',
  'students',
  'classes',
  'timetable',
  'attendance',
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
  'attendance',
  'settings',
];

/** 체육관 — 관리자 탭 (재무 제외) */
const GYM_ADMIN_TABS: NavTab[] = [
  'dashboard',
  'students',
  'parents',
  'classes',
  'timetable',
  'attendance',
  'tuition',
  'unpaid',
  'teachers',
  'calendar',
  'settings',
];

function resolveIndustryType(industry: IndustryType | string | null | undefined): IndustryType {
  return normalizeIndustryType(industry);
}

function getAdminTabs(industryType: IndustryType): NavTab[] {
  if (industryType === 'pilates') return PILATES_ADMIN_TABS;
  if (industryType === 'gym') return GYM_ADMIN_TABS;
  return PIANO_ADMIN_TABS;
}

function getStaffTabs(industryType: IndustryType): NavTab[] {
  if (industryType === 'pilates') return PILATES_STAFF_TABS;
  if (industryType === 'gym') return GYM_STAFF_TABS;
  return PIANO_STAFF_TABS;
}

function withFinanceTabs(base: NavTab[], role: UserRole | string | null | undefined): NavTab[] {
  if (!isOrgOwner(role)) return base;
  const merged = [...base];
  for (const tab of OWNER_FINANCE_TABS) {
    if (!merged.includes(tab)) merged.push(tab);
  }
  return merged;
}

/** 출입(PIN) 꺼진 사업장에서는 attendance 탭만 숨김 (보강 makeups와 분리) */
function filterAttendancePinTab(tabs: NavTab[], attendanceEnabled: boolean): NavTab[] {
  if (attendanceEnabled) return tabs;
  return tabs.filter((t) => t !== ATTENDANCE_PIN_TAB);
}

export function getAllowedTabs(
  role: UserRole | string | null | undefined,
  industry: IndustryType | string | null | undefined,
  settings?: AcademySettings | null
): NavTab[] {
  const industryType = resolveIndustryType(industry);
  const attendanceEnabled = isAttendanceModuleEnabled(settings, industryType);

  if (isOrgAdmin(role)) {
    const base = getAdminTabs(industryType);
    return filterAttendancePinTab(withFinanceTabs(base, role), attendanceEnabled);
  }

  if (isStaffRole(role)) {
    const staffTabs = getStaffTabs(industryType);
    const merged =
      industryType === 'piano'
        ? [...staffTabs, ...PIANO_EDUCATION_TABS.filter((t) => !staffTabs.includes(t))]
        : staffTabs;
    return filterAttendancePinTab(merged, attendanceEnabled);
  }

  if (isParentRole(role)) {
    return [];
  }

  const base = getAdminTabs(industryType);
  return filterAttendancePinTab(withFinanceTabs(base, role), attendanceEnabled);
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
