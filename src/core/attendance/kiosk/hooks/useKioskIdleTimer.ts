import { useCallback, useEffect, useRef } from 'react';

/** 입력 없을 때 idle 콜백 — PIN·개인정보 자동 초기화 */
export function useKioskIdleTimer(
  timeoutSeconds: number,
  onIdle: () => void,
  enabled: boolean
): { bumpActivity: () => void } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedule = useCallback(() => {
    clearTimer();
    if (!enabled || timeoutSeconds <= 0) return;
    timerRef.current = setTimeout(() => {
      onIdleRef.current();
    }, timeoutSeconds * 1000);
  }, [clearTimer, enabled, timeoutSeconds]);

  const bumpActivity = useCallback(() => {
    schedule();
  }, [schedule]);

  useEffect(() => {
    schedule();
    return clearTimer;
  }, [schedule, clearTimer]);

  return { bumpActivity };
}
