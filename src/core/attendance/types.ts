/** 출결 체크 방식 (PIN 외 QR·NFC·키오스크 확장) */
export type CheckInMethod = 'pin' | 'qr' | 'nfc' | 'kiosk' | 'manual';

/** PIN 기반 입·퇴실 세션 */
export interface AttendanceSession {
  id: string;
  customerId: string;
  customerName: string;
  sessionDate: string; // YYYY-MM-DD
  checkInAt?: string;
  checkOutAt?: string;
  checkInMethod?: CheckInMethod;
  checkOutMethod?: CheckInMethod;
  memo?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** PIN 입력 결과 */
export type PinCheckResult =
  | { success: true; action: 'check_in' | 'check_out'; customerId: string; customerName: string; at: string }
  | { success: false; error: PinCheckError; customerName?: string };

export type PinCheckError =
  | 'invalid_pin'
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
