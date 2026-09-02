const PENDING_STAFF_LINK_KEY = 'moa_pending_staff_link';

export function storePendingStaffLink(token: string): void {
  sessionStorage.setItem(PENDING_STAFF_LINK_KEY, token.trim().toUpperCase());
}

export function consumePendingStaffLink(): string | null {
  const token = sessionStorage.getItem(PENDING_STAFF_LINK_KEY);
  if (token) sessionStorage.removeItem(PENDING_STAFF_LINK_KEY);
  return token;
}

export function parseStaffLinkFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const link = params.get('staff_link')?.trim().toUpperCase();
  if (link) {
    const url = new URL(window.location.href);
    url.searchParams.delete('staff_link');
    window.history.replaceState({}, '', url.pathname + url.search);
  }
  return link || null;
}
