import { MIN_PASSWORD_LENGTH } from './authUi';

export function assertNonEmpty(value: string, message: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(message);
  return trimmed;
}

export function assertMinPassword(password: string, label = '비밀번호'): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`${label}는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`);
  }
}

export function assertPasswordMatch(password: string, confirmPassword: string): void {
  if (password !== confirmPassword) {
    throw new Error('비밀번호 확인이 일치하지 않습니다.');
  }
}
