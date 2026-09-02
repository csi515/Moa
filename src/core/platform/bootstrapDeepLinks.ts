import {
  parseGuardianLinkFromUrl,
  storePendingGuardianLink,
} from '@/core/parent/services/guardianLinkService';
import { parseDeepLinksFromUrl } from './deepLinkParser';
import { parseStaffLinkFromUrl, storePendingStaffLink } from './pendingStaffLink';

/** 네이티브/유니버설 링크 URL 문자열 → pending session 저장 */
export function applyDeepLinkFromString(url: string): void {
  const { staffLink, guardianLink } = parseDeepLinksFromUrl(url);
  if (staffLink) storePendingStaffLink(staffLink);
  if (guardianLink) storePendingGuardianLink(guardianLink);
}

/** 웹/PWA: 현재 URL 쿼리(staff_link, link)를 sessionStorage에 저장하고 URL에서 제거 */
export function bootstrapWebDeepLinks(): void {
  const staff = parseStaffLinkFromUrl();
  if (staff) storePendingStaffLink(staff);

  const guardian = parseGuardianLinkFromUrl();
  if (guardian) storePendingGuardianLink(guardian);
}
