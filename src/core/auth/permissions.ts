import type { NavTab } from '@/context/AppContext';
import type { IndustryType } from '@/core/industry/types';
import { normalizeIndustryType } from '@/core/industry/types';
import { getOwnerLabel } from '@/core/industry/industryUi';
import { getIndustryPlugin } from '@/core/industry/registry';
import { withOwnerFinanceTabs } from '@/core/industry/pluginTypes';
import type { UserRole } from '@/types';
import { isAttendanceModuleEnabled } from '@/core/attendance/features';
import type { AcademySettings } from '@/types';

/** owner/admin/manager — 사업장 운영 전체 메뉴 */
export function isOrgAdmin(role: UserRole | string | null | undefined): boolean {
  return role === 'owner' || role === 'admin' || role === 'manager';
}

/** 사업주(owner) 역할 여부 */
export function isOrgOwner(role: UserRole | string | null | undefined): boolean {
  return role === 'owner';
}

/** staff / instructor(강사) 역할 여부 */
export function isStaffRole(role: UserRole | string | null | undefined): boolean {
  return role === 'staff' || role === 'instructor';
}

/** parent / guardian(학부모·보호자) 역할 여부 */
export function isParentRole(role: UserRole | string | null | undefined): boolean {
  return role === 'parent' || role === 'guardian';
}

function resolveIndustryType(industry: IndustryType | string | null | undefined): IndustryType {
  return normalizeIndustryType(industry);
}

/**
 * PIN 출결 꺼진 사업장에서 PIN 전용 탭만 숨김.
 * - check-in 탭이 있으면(피아노): check-in만 숨김 — attendance는 등원 출결
 * - check-in 없으면(체육관 등): attendance가 PIN 화면이므로 숨김
 */
function filterAttendancePinTab(tabs: NavTab[], attendanceEnabled: boolean): NavTab[] {
  if (attendanceEnabled) return tabs;
  const hasSeparateCheckIn = tabs.includes('check-in');
  return tabs.filter((t) => {
    if (t === 'check-in') return false;
    if (t === 'attendance' && !hasSeparateCheckIn) return false;
    return true;
  });
}

function appendAccountTab(tabs: NavTab[]): NavTab[] {
  if (tabs.length === 0) return tabs;
  return tabs.includes('account') ? tabs : [...tabs, 'account'];
}

export function getAllowedTabs(
  role: UserRole | string | null | undefined,
  industry: IndustryType | string | null | undefined,
  settings?: AcademySettings | null
): NavTab[] {
  const industryType = resolveIndustryType(industry);
  const plugin = getIndustryPlugin(industryType);
  const attendanceEnabled = isAttendanceModuleEnabled(settings, industryType);

  if (isOrgAdmin(role)) {
    const base = isOrgOwner(role)
      ? withOwnerFinanceTabs(plugin.adminTabs)
      : plugin.adminTabs;
    return appendAccountTab(filterAttendancePinTab(base, attendanceEnabled));
  }

  if (isStaffRole(role)) {
    return appendAccountTab(filterAttendancePinTab(plugin.staffTabs, attendanceEnabled));
  }

  if (isParentRole(role)) {
    return [];
  }

  // customer/member/null/unknown — admin 폴백 금지 (최소 권한)
  return [];
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
export function getUserRoleLabel(
  role: UserRole | string | null | undefined,
  industry?: IndustryType | string | null
): string {
  const ownerLabel = industry != null ? getOwnerLabel(industry) : '대표';
  const labels: Record<UserRole, string> = {
    owner: ownerLabel,
    admin: '관리자',
    manager: '매니저',
    staff: '강사',
    parent: '학부모',
    instructor: '강사',
    member: '회원',
    customer: '고객',
    guardian: '보호자',
  };
  if (!role || !(role in labels)) return '사용자';
  return labels[role as UserRole];
}

/** 역할별 아바타 이니셜 */
export function getUserRoleBadge(
  role: UserRole | string | null | undefined,
  industry?: IndustryType | string | null
): string {
  const ownerBadge = industry != null ? getOwnerLabel(industry) : '대표';
  const badges: Record<UserRole, string> = {
    owner: ownerBadge,
    admin: '관리',
    manager: '매니저',
    staff: '강사',
    parent: '학부',
    instructor: '강사',
    member: '회원',
    customer: '고객',
    guardian: '보호자',
  };
  if (!role || !(role in badges)) return '사용자';
  return badges[role as UserRole];
}
