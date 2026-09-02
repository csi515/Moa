/** URL·딥링크 문자열에서 staff_link / link(학부모) 쿼리 추출 */

export interface ParsedDeepLinks {
  staffLink: string | null;
  guardianLink: string | null;
}

export function parseDeepLinksFromUrl(url: string): ParsedDeepLinks {
  try {
    const parsed = new URL(url);
    const staffLink = parsed.searchParams.get('staff_link')?.trim().toUpperCase() || null;
    const guardianLink = parsed.searchParams.get('link')?.trim().toUpperCase() || null;
    return { staffLink, guardianLink };
  } catch {
    return { staffLink: null, guardianLink: null };
  }
}

export function parseDeepLinksFromHref(): ParsedDeepLinks {
  if (typeof window === 'undefined') {
    return { staffLink: null, guardianLink: null };
  }
  return parseDeepLinksFromUrl(window.location.href);
}
