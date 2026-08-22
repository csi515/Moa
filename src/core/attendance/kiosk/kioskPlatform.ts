/**
 * 플랫폼별 키오스크 운영 가이드 (앱 코드가 OS 버튼을 차단하지 않음)
 *
 * - Android: Device Owner / COSU(키오스크) 모드, 또는 Fully Managed MDM
 * - iPadOS: Guided Access(설정 > 손쉬운 사용) 또는 MDM Single App Mode
 * - PWA: 홈 화면 추가 후 standalone/fullscreen manifest
 * - Capacitor: capacitor.config.ts + dist 빌드 → Android/iOS 프로젝트 생성
 */

import { isNativeKioskShell } from './kioskConfig';

type WakeLockSentinel = { release: () => Promise<void> };

let activeWakeLock: WakeLockSentinel | null = null;

/** PWA Screen Wake Lock. Capacitor 패키징 시 @capacitor-community/keep-awake로 대체 가능 */
export async function enableScreenAwake(): Promise<void> {
  if (isNativeKioskShell()) {
    // Capacitor KeepAwake 플러그인 연동 지점
    return;
  }
  if (!('wakeLock' in navigator)) return;
  try {
    activeWakeLock = await navigator.wakeLock.request('screen');
    activeWakeLock.addEventListener?.('release', () => {
      activeWakeLock = null;
    });
  } catch {
    /* 권한/배터리 정책으로 실패 가능 — OS 키오스크/Guided Access로 보완 */
  }
}

export async function disableScreenAwake(): Promise<void> {
  if (isNativeKioskShell()) return;
  try {
    await activeWakeLock?.release();
  } catch {
    /* ignore */
  }
  activeWakeLock = null;
}

/** 탭 복귀 시 Wake Lock 재요청 (브라우저가 해제하는 경우) */
export function bindWakeLockRecovery(onVisible: () => void): () => void {
  const handler = () => {
    if (document.visibilityState === 'visible') onVisible();
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}
