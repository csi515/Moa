import type { SignUpBusinessDetails } from '../types/signup';

const PHONE_PATTERN = /^01[0-9][0-9]{7,8}$/;

export function normalizePhoneInput(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export function isValidKoreanMobilePhone(phone: string): boolean {
  const digits = normalizePhoneInput(phone);
  return PHONE_PATTERN.test(digits);
}

export function validateSignUpBusiness(details: SignUpBusinessDetails): void {
  if (!details.businessName.trim()) {
    throw new Error('사업장 이름을 입력해 주세요.');
  }
  if (!details.phone.trim()) {
    throw new Error('대표자 휴대폰 번호를 입력해 주세요.');
  }
  if (!isValidKoreanMobilePhone(details.phone)) {
    throw new Error('올바른 휴대폰 번호를 입력해 주세요. (예: 01012345678)');
  }
  if (!details.address.trim()) {
    throw new Error('사업장 주소를 입력해 주세요.');
  }
  if (details.address.trim().length < 5) {
    throw new Error('사업장 주소를 더 자세히 입력해 주세요.');
  }
  if (details.businessNumber?.trim()) {
    const digits = details.businessNumber.replace(/[^0-9]/g, '');
    if (digits.length !== 10) {
      throw new Error('사업자등록번호는 10자리 숫자로 입력해 주세요.');
    }
  }
}
