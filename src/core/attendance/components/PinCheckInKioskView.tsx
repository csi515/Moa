import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import { StorageService } from '@/services/storage';
import { isAttendanceModuleEnabled } from '../features';
import type { CheckInMethod } from '../types';
import type { KioskRuntimeSettings } from '../kiosk/kioskConfig';
import { KIOSK_DEFAULTS } from '../kiosk/kioskConfig';
import { useKioskIdleTimer } from '../kiosk/hooks/useKioskIdleTimer';
import { Delete, CheckCircle2, XCircle } from 'lucide-react';

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'] as const;

type KioskPhase = 'idle' | 'processing' | 'result';

interface PinCheckInKioskViewProps {
  method?: CheckInMethod;
  /** embedded: 관리 화면 탭 / standalone: `/kiosk` PWA 전용 */
  mode?: 'embedded' | 'standalone';
  kioskSettings?: KioskRuntimeSettings;
}

export const PinCheckInKioskView: React.FC<PinCheckInKioskViewProps> = ({
  method = 'pin',
  mode = 'embedded',
  kioskSettings = KIOSK_DEFAULTS,
}) => {
  const { showToast } = useApp();
  const org = useOptionalOrganization();
  const organizationId = org?.currentOrganization?.id || 'local-org';
  const industry = org?.currentOrganization?.industry_type || 'piano';
  const settings = StorageService.getSettings();
  const isStandalone = mode === 'standalone';

  const [pin, setPin] = useState('');
  const [phase, setPhase] = useState<KioskPhase>('idle');
  const [resultAction, setResultAction] = useState<'check_in' | 'check_out' | null>(null);
  const [resultName, setResultName] = useState<string | null>(null);
  const [showName, setShowName] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const moduleEnabled = isAttendanceModuleEnabled(settings, industry);
  const maskedPin = useMemo(() => (pin ? '●'.repeat(pin.length) : ''), [pin]);

  const clearResetTimers = useCallback(() => {
    resetTimersRef.current.forEach(clearTimeout);
    resetTimersRef.current = [];
  }, []);

  const resetToIdle = useCallback(() => {
    clearResetTimers();
    setPin('');
    setPhase('idle');
    setResultAction(null);
    setResultName(null);
    setShowName(false);
    setErrorMessage(null);
  }, [clearResetTimers]);

  const scheduleReset = useCallback(
    (delayMs: number) => {
      const id = setTimeout(resetToIdle, delayMs);
      resetTimersRef.current.push(id);
    },
    [resetToIdle]
  );

  const { bumpActivity } = useKioskIdleTimer(
    kioskSettings.idleTimeoutSeconds,
    resetToIdle,
    moduleEnabled && phase !== 'processing'
  );

  useEffect(() => () => clearResetTimers(), [clearResetTimers]);

  const showResult = useCallback(
    (action: 'check_in' | 'check_out', customerName: string) => {
      setPhase('result');
      setResultAction(action);
      setResultName(customerName);
      setShowName(true);
      setErrorMessage(null);
      setPin('');

      const nameMs = kioskSettings.resultWithNameSeconds * 1000;
      const totalMs = kioskSettings.resultDisplaySeconds * 1000;

      const hideNameId = setTimeout(() => setShowName(false), nameMs);
      resetTimersRef.current.push(hideNameId);
      scheduleReset(Math.max(totalMs, nameMs));
    },
    [kioskSettings.resultDisplaySeconds, kioskSettings.resultWithNameSeconds, scheduleReset]
  );

  const showError = useCallback(
    (message: string) => {
      setPhase('result');
      setResultAction(null);
      setResultName(null);
      setShowName(false);
      setErrorMessage(message);
      setPin('');
      scheduleReset(kioskSettings.resultDisplaySeconds * 1000);
    },
    [kioskSettings.resultDisplaySeconds, scheduleReset]
  );

  const handleKey = useCallback(
    async (key: (typeof KEYPAD)[number]) => {
      if (phase === 'processing') return;
      bumpActivity();

      if (phase === 'result') {
        resetToIdle();
      }

      if (key === 'clear') {
        setPin('');
        setErrorMessage(null);
        if (phase === 'idle') return;
        setPhase('idle');
        return;
      }

      if (key === 'enter') {
        if (pin.length < 4) {
          showError('PIN은 4자리 이상 입력해 주세요.');
          return;
        }
        const pinToSubmit = pin;
        setPin('');
        setPhase('processing');
        try {
          const result = await StorageService.toggleCheckInByPin(
            pinToSubmit,
            isStandalone ? 'kiosk' : (method as CheckInMethod),
            organizationId
          );
          if (result.success) {
            showResult(result.action, result.customerName);
            if (!isStandalone) {
              const actionLabel = result.action === 'check_in' ? '입실' : '퇴실';
              showToast(`${result.customerName}님 ${actionLabel} 처리되었습니다.`, 'success');
            }
          } else {
            const messages: Record<string, string> = {
              invalid_pin: '등록되지 않은 PIN입니다.',
              already_checked_out: '이미 퇴실 처리되었습니다.',
              module_disabled: '출결 모듈이 비활성화되어 있습니다.',
            };
            showError(messages[result.error] || '처리할 수 없습니다.');
          }
        } catch {
          showError('처리 중 오류가 발생했습니다.');
        }
        return;
      }

      if (pin.length >= 8) return;
      setPhase('idle');
      setPin((prev) => prev + key);
    },
    [
      bumpActivity,
      isStandalone,
      method,
      organizationId,
      phase,
      pin,
      resetToIdle,
      showError,
      showResult,
      showToast,
    ]
  );

  if (!moduleEnabled) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500 max-w-md w-full">
        출결 모듈이 비활성화되어 있습니다. 설정에서 활성화해 주세요.
      </div>
    );
  }

  const actionLabel =
    resultAction === 'check_in' ? '입실' : resultAction === 'check_out' ? '퇴실' : null;

  const displayMessage = (() => {
    if (phase === 'processing') return { text: '처리 중…', tone: 'info' as const };
    if (errorMessage) return { text: errorMessage, tone: 'error' as const };
    if (phase === 'result' && actionLabel) {
      const text =
        showName && resultName
          ? `${resultName}님 ${actionLabel} 완료`
          : `${actionLabel} 완료`;
      return { text, tone: 'success' as const };
    }
    return null;
  })();

  const containerClass = isStandalone
    ? 'w-full max-w-lg'
    : 'max-w-md mx-auto w-full';

  const keySizeClass = isStandalone ? 'min-h-[72px] text-2xl' : 'min-h-[56px] text-lg';

  return (
    <div className={containerClass}>
      <div
        className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 ${
          isStandalone ? 'shadow-lg' : ''
        }`}
      >
        <div className="text-center mb-6">
          <p className="text-xs text-slate-500 font-semibold">출결 키패드</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {phase === 'idle' ? 'PIN 입력' : phase === 'processing' ? '확인 중' : '완료'}
          </h3>
          {phase === 'idle' && (
            <p className="text-xs text-slate-400 mt-2">같은 PIN을 다시 입력하면 퇴실 처리됩니다</p>
          )}
        </div>

        <div
          className={`h-16 sm:h-20 rounded-2xl border-2 flex items-center justify-center text-2xl sm:text-3xl tracking-[0.5em] font-mono mb-4 transition-colors ${
            displayMessage?.tone === 'error'
              ? 'border-rose-300 bg-rose-50'
              : displayMessage?.tone === 'success'
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-slate-200 bg-slate-50'
          }`}
          aria-label="PIN 입력 표시"
          aria-live="polite"
        >
          {phase === 'result' && displayMessage ? (
            <span className="tracking-normal text-base sm:text-lg font-bold px-2 text-center leading-snug">
              {displayMessage.text}
            </span>
          ) : (
            maskedPin || '••••'
          )}
        </div>

        {displayMessage && phase !== 'idle' && (
          <div
            className={`flex items-center justify-center gap-2 mb-4 text-sm font-bold ${
              displayMessage.tone === 'success'
                ? 'text-emerald-600'
                : displayMessage.tone === 'error'
                  ? 'text-rose-600'
                  : 'text-slate-500'
            }`}
          >
            {displayMessage.tone === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {displayMessage.tone === 'error' && <XCircle className="w-4 h-4" />}
            <span>{phase === 'processing' ? displayMessage.text : null}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {KEYPAD.map((key) => {
            const disabled = phase === 'processing';
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => handleKey(key)}
                className={`${keySizeClass} rounded-2xl font-black transition-all active:scale-95 touch-manipulation ${
                  key === 'enter'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : key === 'clear'
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {key === 'clear' ? <Delete className="w-6 h-6 mx-auto" /> : key === 'enter' ? '확인' : key}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
