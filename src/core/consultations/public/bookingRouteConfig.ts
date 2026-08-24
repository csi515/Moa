/** 공개 상담 예약 URL (/book/:slug) */
export function parsePublicBookingSlug(): string | null {
  const match = window.location.pathname.match(/^\/book\/([^/]+)\/?$/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

export function isPublicBookingRoute(): boolean {
  return parsePublicBookingSlug() !== null;
}

export function getPublicBookingUrl(slug: string): string {
  const normalized = slug.trim();
  return `${window.location.origin}/book/${encodeURIComponent(normalized)}`;
}
