/** Organization 공개 업체 코드 (상담 QR·공개 URL 식별 전용) */

/** 혼동 문자 제외: 0/O, 1/I/l */
export const ORGANIZATION_PUBLIC_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export const ORGANIZATION_PUBLIC_CODE_MIN_LENGTH = 8;
export const ORGANIZATION_PUBLIC_CODE_MAX_LENGTH = 16;
export const ORGANIZATION_PUBLIC_CODE_DEFAULT_LENGTH = 10;

const FORMAT_REGEX = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8,16}$/;
const PUBLIC_BOOKING_PATH = /^\/book\/([^/]+)\/?$/;

/** 입력값을 허용 문자만 남기고 대문자로 정규화 */
export function normalizeOrganizationPublicCode(input: string): string {
  const upper = input.toUpperCase();
  return upper
    .split('')
    .filter((ch) => ORGANIZATION_PUBLIC_CODE_ALPHABET.includes(ch))
    .join('');
}

export function isValidOrganizationPublicCode(code: string): boolean {
  return FORMAT_REGEX.test(code);
}

export function getOrganizationPublicCodeError(code: string): string | null {
  if (!code) return '업체 코드를 입력해 주세요.';
  if (code.length < ORGANIZATION_PUBLIC_CODE_MIN_LENGTH) {
    return `업체 코드는 ${ORGANIZATION_PUBLIC_CODE_MIN_LENGTH}자 이상이어야 합니다.`;
  }
  if (code.length > ORGANIZATION_PUBLIC_CODE_MAX_LENGTH) {
    return `업체 코드는 ${ORGANIZATION_PUBLIC_CODE_MAX_LENGTH}자 이하여야 합니다.`;
  }
  if (!isValidOrganizationPublicCode(code)) {
    return '0/O, 1/I/l 등 혼동하기 쉬운 문자는 사용할 수 없습니다.';
  }
  return null;
}

/** 상담 예약 공개 URL (/book/:publicCode) */
export function getPublicBookingUrl(publicCode: string): string {
  const normalized = normalizeOrganizationPublicCode(publicCode);
  return `${window.location.origin}/book/${encodeURIComponent(normalized)}`;
}

/** URL 경로에서 업체 코드 추출 */
export function parsePublicBookingCode(): string | null {
  const match = window.location.pathname.match(PUBLIC_BOOKING_PATH);
  if (!match) return null;
  return decodeURIComponent(match[1]).toUpperCase();
}

export function isPublicBookingRoute(): boolean {
  return parsePublicBookingCode() !== null;
}
