import type { Student } from '@/types';
import type { AttendanceSession, CheckInMethod, PinCheckResult } from '../types';
import { generatePinCode, hashCheckInPin, isValidPinFormat } from './pinService';

export interface CustomerPinRecord {
  customerId: string;
  pinHash: string;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowIso(): string {
  return new Date().toISOString();
}

/** 고객별 PIN 해시 맵에서 PIN 검색 */
export async function findCustomerByPinAsync(
  pin: string,
  pinRecords: CustomerPinRecord[],
  organizationId: string
): Promise<CustomerPinRecord | null> {
  const trimmed = pin.trim();
  if (!isValidPinFormat(trimmed)) return null;

  for (const record of pinRecords) {
    const hash = await hashCheckInPin(organizationId, record.customerId, trimmed);
    if (hash === record.pinHash) return record;
  }
  return null;
}

/** PIN 토글: 입실 → 퇴실 */
export async function toggleCheckInByPinLocal(params: {
  organizationId: string;
  pin: string;
  method: CheckInMethod;
  pinRecords: CustomerPinRecord[];
  sessions: AttendanceSession[];
  students: Student[];
  moduleEnabled: boolean;
}): Promise<{ result: PinCheckResult; sessions: AttendanceSession[] }> {
  const { organizationId, pin, method, pinRecords, sessions, students, moduleEnabled } = params;

  if (!moduleEnabled) {
    return { result: { success: false, error: 'module_disabled' }, sessions };
  }

  const pinRecord = await findCustomerByPinAsync(pin, pinRecords, organizationId);
  if (!pinRecord) {
    return { result: { success: false, error: 'invalid_pin' }, sessions };
  }

  const student = students.find((s) => s.id === pinRecord.customerId && s.status === 'active');
  if (!student) {
    return { result: { success: false, error: 'invalid_pin' }, sessions };
  }

  const today = todayDateString();
  const now = nowIso();
  const next = [...sessions];
  const idx = next.findIndex(
    (s) => s.customerId === pinRecord.customerId && s.sessionDate === today
  );

  if (idx < 0) {
    const created: AttendanceSession = {
      id: `att-sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      customerId: student.id,
      customerName: student.name,
      sessionDate: today,
      checkInAt: now,
      checkInMethod: method,
      createdAt: now,
    };
    next.unshift(created);
    return {
      result: {
        success: true,
        action: 'check_in',
        customerId: student.id,
        customerName: student.name,
        at: now,
      },
      sessions: next,
    };
  }

  const existing = next[idx];
  if (existing.checkOutAt) {
    return {
      result: {
        success: false,
        error: 'already_checked_out',
        customerName: student.name,
      },
      sessions: next,
    };
  }

  if (!existing.checkInAt) {
    next[idx] = {
      ...existing,
      checkInAt: now,
      checkInMethod: method,
      updatedAt: now,
    };
    return {
      result: {
        success: true,
        action: 'check_in',
        customerId: student.id,
        customerName: student.name,
        at: now,
      },
      sessions: next,
    };
  }

  next[idx] = {
    ...existing,
    checkOutAt: now,
    checkOutMethod: method,
    updatedAt: now,
  };
  return {
    result: {
      success: true,
      action: 'check_out',
      customerId: student.id,
      customerName: student.name,
      at: now,
    },
    sessions: next,
  };
}

/** PIN 중복 검사 후 해시 생성 */
export async function assignCustomerPin(params: {
  organizationId: string;
  customerId: string;
  pin: string;
  pinRecords: CustomerPinRecord[];
}): Promise<{ ok: true; pinHash: string } | { ok: false; error: 'invalid_pin_format' | 'pin_already_used' }> {
  const { organizationId, customerId, pin, pinRecords } = params;
  if (!isValidPinFormat(pin)) {
    return { ok: false, error: 'invalid_pin_format' };
  }

  const pinHash = await hashCheckInPin(organizationId, customerId, pin);
  const duplicate = pinRecords.some(
    (r) => r.customerId !== customerId && r.pinHash === pinHash
  );
  if (duplicate) {
    return { ok: false, error: 'pin_already_used' };
  }

  return { ok: true, pinHash };
}

/** 충돌 없는 PIN 자동 발급 */
export async function generateUniquePin(params: {
  organizationId: string;
  customerId: string;
  pinRecords: CustomerPinRecord[];
}): Promise<{ pin: string; pinHash: string }> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const pin = generatePinCode(4);
    const result = await assignCustomerPin({
      organizationId: params.organizationId,
      customerId: params.customerId,
      pin,
      pinRecords: params.pinRecords,
    });
    if (result.ok) {
      return { pin, pinHash: result.pinHash };
    }
  }
  const pin = generatePinCode(6);
  const result = await assignCustomerPin({
    organizationId: params.organizationId,
    customerId: params.customerId,
    pin,
    pinRecords: params.pinRecords,
  });
  if (!result.ok) throw new Error('PIN 생성 실패');
  return { pin, pinHash: result.pinHash };
}

/** 세션 상태 라벨 */
export function getSessionStatusLabel(session?: AttendanceSession): {
  label: string;
  tone: 'success' | 'warning' | 'muted' | 'error';
} {
  if (!session || !session.checkInAt) {
    return { label: '미출석', tone: 'muted' };
  }
  if (!session.checkOutAt) {
    return { label: '입실', tone: 'success' };
  }
  return { label: '퇴실', tone: 'warning' };
}

export function formatSessionTime(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** 당일 입실(체크인) 완료 고객 수 */
export function countTodayCheckedInCustomers(
  sessions: AttendanceSession[],
  date: string = todayDateString()
): number {
  const daySessions = sessions.filter((session) => session.sessionDate === date);
  return new Set(daySessions.filter((session) => session.checkInAt).map((session) => session.customerId))
    .size;
}
