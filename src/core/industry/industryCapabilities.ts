/**
 * Industry ↔ Capability 조합. Core는 @/capabilities 를 import하지 않는다.
 * Capability id 존재 여부는 contract test가 CAPABILITY_IDS와 대조한다.
 */
export type IndustryCapabilityFlagMap = Partial<Record<string, boolean>>;

/** 탭이 이 capability에 묶이면, capability가 꺼진 업종에서는 숨긴다. */
export const NAV_TAB_REQUIRED_CAPABILITY: Readonly<Record<string, string>> = {
  attendance: 'attendance',
  'check-in': 'attendance',
  tuition: 'billing',
  unpaid: 'billing',
  finance: 'billing',
  expenses: 'billing',
  payroll: 'billing',
  shuttle: 'transport',
  'enrollment-requests': 'enrollment',
  consultations: 'consultation',
  'practice-rooms': 'resources',
  parents: 'parent',
  sales: 'commerce',
  retail: 'commerce',
  inventory: 'commerce',
};

export function enabledIndustryCapabilities(
  capabilities: IndustryCapabilityFlagMap | undefined
): string[] {
  if (!capabilities) return [];
  return Object.entries(capabilities)
    .filter(([, on]) => on === true)
    .map(([id]) => id)
    .sort();
}

export function isIndustryCapabilityEnabled(
  capabilities: IndustryCapabilityFlagMap | undefined,
  capabilityId: string
): boolean {
  return capabilities?.[capabilityId] === true;
}

export function isIndustryCapabilityDefaultOn(
  defaults: IndustryCapabilityFlagMap | undefined,
  capabilityId: string
): boolean {
  return defaults?.[capabilityId] === true;
}

/**
 * income은 billing(수납) 또는 commerce(판매내역) 중 하나가 있으면 유지한다.
 * 그 외 탭은 NAV_TAB_REQUIRED_CAPABILITY 만 본다.
 */
export function isNavTabAllowedForCapabilities(
  tab: string,
  capabilities: IndustryCapabilityFlagMap | undefined
): boolean {
  if (tab === 'income') {
    return (
      isIndustryCapabilityEnabled(capabilities, 'billing') ||
      isIndustryCapabilityEnabled(capabilities, 'commerce')
    );
  }
  const required = NAV_TAB_REQUIRED_CAPABILITY[tab];
  if (!required) return true;
  return isIndustryCapabilityEnabled(capabilities, required);
}

export function filterTabsByIndustryCapabilities<T extends string>(
  tabs: readonly T[],
  capabilities: IndustryCapabilityFlagMap | undefined
): T[] {
  return tabs.filter((tab) => isNavTabAllowedForCapabilities(tab, capabilities));
}

/** enabled capability가 갖춰야 할 네비/뷰 단서 */
export const CAPABILITY_IMPLEMENTATION_TABS: Readonly<Record<string, readonly string[]>> = {
  roster: ['students', 'members'],
  scheduling: ['timetable', 'calendar', 'classes', 'bookings'],
  booking: ['bookings', 'services'],
  billing: ['tuition', 'unpaid', 'finance', 'income', 'expenses', 'payroll'],
  attendance: ['attendance', 'check-in'],
  parent: ['parents'],
  enrollment: ['enrollment-requests'],
  consultation: ['consultations'],
  resources: ['practice-rooms', 'resources'],
  transport: ['shuttle'],
  commerce: ['sales', 'retail', 'inventory', 'textbooks'],
};
