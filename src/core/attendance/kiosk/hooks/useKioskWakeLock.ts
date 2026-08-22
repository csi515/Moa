import { useEffect } from 'react';
import { bindWakeLockRecovery, disableScreenAwake, enableScreenAwake } from '../kioskPlatform';

/** 키오스크 화면 유지 — PWA Wake Lock (Capacitor는 kioskPlatform에서 확장) */
export function useKioskWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    let unbind = () => {};

    const acquire = () => {
      void enableScreenAwake();
    };

    acquire();
    unbind = bindWakeLockRecovery(acquire);

    return () => {
      unbind();
      void disableScreenAwake();
    };
  }, [enabled]);
}
