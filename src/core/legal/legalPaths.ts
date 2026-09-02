export type LegalPageId = 'privacy' | 'terms';

export function getPublicLegalPage(): LegalPageId | null {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  if (hash === 'privacy' || hash === 'terms') return hash;

  const path = window.location.pathname.replace(/\/$/, '');
  if (path === '/privacy' || path.endsWith('/privacy')) return 'privacy';
  if (path === '/terms' || path.endsWith('/terms')) return 'terms';

  return null;
}

export function legalPageHref(page: LegalPageId): string {
  return `/${page}`;
}
