/** 공개 상담 예약 URL (/book/:publicCode) — 업체 코드로 Organization 식별 */
export function parsePublicBookingCode(): string | null {
  const match = window.location.pathname.match(/^\/book\/([^/]+)\/?$/);
  if (!match) return null;
  return decodeURIComponent(match[1]).toUpperCase();
}

export function isPublicBookingRoute(): boolean {
  return parsePublicBookingCode() !== null;
}

/** @deprecated bookingRouteConfig — getPublicBookingUrl는 core/organizations/publicCode 사용 */
export { getPublicBookingUrl } from '@/core/organizations/publicCode';
