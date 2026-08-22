const PARENT_PORTAL_MODE_KEY = 'moa_parent_portal_active';

export function isParentPortalModeActive(): boolean {
  return sessionStorage.getItem(PARENT_PORTAL_MODE_KEY) === '1';
}

export function setParentPortalModeActive(active: boolean): void {
  if (active) {
    sessionStorage.setItem(PARENT_PORTAL_MODE_KEY, '1');
  } else {
    sessionStorage.removeItem(PARENT_PORTAL_MODE_KEY);
  }
}
