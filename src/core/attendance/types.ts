/** 출결 체크 방식 (PIN 외 QR·NFC·키오스크 확장) */
export type CheckInMethod = 'pin' | 'qr' | 'nfc' | 'kiosk' | 'manual';

/** PIN 기반 출석(입실) 세션 — 퇴실은 제품 범위 밖(레거시 필드만 보존) */
export interface AttendanceSession {
  id: string;
  customerId: string;
  customerName: string;
  sessionDate: string; // YYYY-MM-DD
  checkInAt?: string;
  /** @deprecated 퇴실 미사용 — 기존 데이터 보존용 */
  checkOutAt?: string;
  checkInMethod?: CheckInMethod;
  /** @deprecated 퇴실 미사용 */
  checkOutMethod?: CheckInMethod;
  memo?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** PIN 입력 결과 (출석만) */
export type PinCheckResult =
  | { success: true; action: 'check_in'; customerId: string; customerName: string; at: string }
  | { success: false; error: PinCheckError; customerName?: string };

export type PinCheckError =
  | 'invalid_pin'
  | 'already_checked_in'
  /** @deprecated 퇴실 제거 — already_checked_in 사용 */
  | 'already_checked_out'
  | 'module_disabled'
  | 'pin_already_used'
  | 'forbidden'
  | 'customer_not_found'
  | 'invalid_pin_format';

/** 조직 출결 모듈 설정 */
export interface AttendanceModuleSettings {
  enabled: boolean;
}
