import type { NavTab } from '@/context/AppContext';
import type { IndustryType } from '@/core/industry/types';
import { normalizeIndustryType } from '@/core/industry/types';
import { getIndustryPlugin } from '@/core/industry/registry';
import { withOwnerFinanceTabs } from '@/core/industry/pluginTypes';
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

/** 출입(PIN) 탭 — 사업장 설정으로 on/off */
const ATTENDANCE_PIN_TAB: NavTab = 'attendance';

function resolveIndustryType(industry: IndustryType | string | null | undefined): IndustryType {
  return normalizeIndustryType(industry);
}

/** 출입(PIN) 꺼진 사업장에서는 attendance 탭만 숨김 */
function filterAttendancePinTab(tabs: NavTab[], attendanceEnabled: boolean): NavTab[] {
  if (attendanceEnabled) return tabs;
  return tabs.filter((t) => t !== ATTENDANCE_PIN_TAB);
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

  return appendAccountTab(filterAttendancePinTab(withOwnerFinanceTabs(plugin.adminTabs), attendanceEnabled));
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
    instructor: '강사',
    member: '회원',
    customer: '고객',
    guardian: '보호자',
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
    instructor: '강사',
    member: '회원',
    customer: '고객',
    guardian: '보호자',
  };
  if (!role || !(role in badges)) return '운영';
  return badges[role as UserRole];
}
