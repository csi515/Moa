import type { AcademySettings } from '@/types';
import type { AttendanceModuleSettings } from '../types';

/** 키오스크 기본값 — Android/iPad 전용 기기·PWA 공통 */
export const KIOSK_DEFAULTS = {
  idleTimeoutSeconds: 30,
  /** 이름 포함 결과 표시 (초). 이후 익명 메시지 또는 idle 복귀 */
  resultWithNameSeconds: 1.5,
  /** 출결 처리 후 idle 복귀까지 최대 시간 (초) */
  resultDisplaySeconds: 2,
  wakeLockEnabled: true,
} as const;

export type KioskRuntimeSettings = typeof KIOSK_DEFAULTS;

export function resolveKioskSettings(
  settings: AcademySettings | null | undefined
): KioskRuntimeSettings {
  const kiosk = settings?.features?.attendance?.kiosk;
  return {
    idleTimeoutSeconds: kiosk?.idleTimeoutSeconds ?? KIOSK_DEFAULTS.idleTimeoutSeconds,
    resultWithNameSeconds: kiosk?.resultWithNameSeconds ?? KIOSK_DEFAULTS.resultWithNameSeconds,
    resultDisplaySeconds: kiosk?.resultDisplaySeconds ?? KIOSK_DEFAULTS.resultDisplaySeconds,
    wakeLockEnabled: kiosk?.wakeLockEnabled ?? KIOSK_DEFAULTS.wakeLockEnabled,
  };
}

/** `/kiosk` 경로 또는 `?kiosk=1` 쿼리 */
export function isKioskRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/kiosk' || path.endsWith('/kiosk')) return true;
  return new URLSearchParams(window.location.search).get('kiosk') === '1';
}

/** Capacitor 네이티브 셸 여부 (패키징 후 감지) */
export function isNativeKioskShell(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export function getAttendanceFeatureSettings(
  settings: AcademySettings | null | undefined
): AttendanceModuleSettings {
  return settings?.features?.attendance ?? { enabled: undefined as unknown as boolean };
}
