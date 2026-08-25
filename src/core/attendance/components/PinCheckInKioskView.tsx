import React, { useCallback, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import { StorageService } from '@/services/storage';
import { isAttendanceModuleEnabled } from '../features';
import type { CheckInMethod } from '../types';
import { Delete, RotateCcw } from 'lucide-react';
import { getIndustryAccent } from '@/core/industry/industryUi';

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'] as const;

interface PinCheckInKioskViewProps {
  method?: CheckInMethod;
}

export const PinCheckInKioskView: React.FC<PinCheckInKioskViewProps> = ({ method = 'pin' }) => {
  const { showToast } = useApp();
  const org = useOptionalOrganization();
  const organizationId = org?.currentOrganization?.id || 'local-org';
  const industry = org?.currentOrganization?.industry_type || 'piano';
  const settings = StorageService.getSettings();

  const [pin, setPin] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; tone: 'success' | 'error' | 'info' } | null>(null);
  const [processing, setProcessing] = useState(false);

  const moduleEnabled = isAttendanceModuleEnabled(settings, industry);
  const accent = getIndustryAccent(industry);

  const maskedPin = useMemo(() => (pin ? '●'.repeat(pin.length) : ''), [pin]);

  const handleKey = useCallback(
    async (key: (typeof KEYPAD)[number]) => {
      if (processing) return;

      if (key === 'clear') {
        setPin('');
        setFeedback(null);
        return;
      }

      if (key === 'enter') {
        if (pin.length < 4) {
          setFeedback({ text: 'PIN은 4자리 이상 입력해 주세요.', tone: 'error' });
          return;
        }
        setProcessing(true);
        try {
          const result = await StorageService.toggleCheckInByPin(
            pin,
            method as CheckInMethod,
            organizationId
          );
          if (result.success) {
            const actionLabel = result.action === 'check_in' ? '입실' : '퇴실';
            setFeedback({
              text: `${result.customerName}님 ${actionLabel} 완료`,
              tone: 'success',
            });
            showToast(`${result.customerName}님 ${actionLabel} 처리되었습니다.`, 'success');
          } else if (result.success === false) {
            const err = result.error;
            const messages: Record<string, string> = {
              invalid_pin: '등록되지 않은 PIN입니다.',
              already_checked_out: `${result.customerName ?? '회원'}님은 이미 퇴실 처리되었습니다.`,
              module_disabled: '출결 모듈이 비활성화되어 있습니다.',
            };
            setFeedback({
              text: messages[err] || '처리할 수 없습니다.',
              tone: 'error',
            });
          }
        } finally {
          setPin('');
          setProcessing(false);
          setTimeout(() => setFeedback(null), 3000);
        }
        return;
      }

      if (pin.length >= 8) return;
      setPin((prev) => prev + key);
    },
    [pin, processing, method, organizationId, showToast]
  );

  if (!moduleEnabled) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
        출결 모듈이 비활성화되어 있습니다. 설정에서 활성화해 주세요.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-4 md:pb-0">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="text-center mb-6">
          <p className="text-xs text-slate-500 font-semibold">출결 키패드</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">PIN 입력</h3>
          <p className="text-xs text-slate-400 mt-2">같은 PIN을 다시 입력하면 퇴실 처리됩니다</p>
        </div>

        <div
          className={`h-14 rounded-2xl border-2 flex items-center justify-center text-2xl tracking-[0.5em] font-mono mb-4 ${
            feedback?.tone === 'error'
              ? 'border-rose-300 bg-rose-50'
              : feedback?.tone === 'success'
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-slate-200 bg-slate-50'
          }`}
          aria-label="PIN 입력 표시"
        >
          {maskedPin || '••••'}
        </div>

        {feedback && (
          <p
            className={`text-center text-sm font-bold mb-4 ${
              feedback.tone === 'success'
                ? 'text-emerald-600'
                : feedback.tone === 'error'
                  ? 'text-rose-600'
                  : 'text-slate-600'
            }`}
          >
            {feedback.text}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {KEYPAD.map((key) => {
            const isAction = key === 'clear' || key === 'enter';
            return (
              <button
                key={key}
                type="button"
                disabled={processing}
                onClick={() => handleKey(key)}
                className={`min-h-[56px] rounded-2xl text-lg font-black transition-all active:scale-95 ${
                  key === 'enter'
                    ? `${accent.btn} text-white ${accent.btnHover}`
                    : key === 'clear'
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'
                } ${processing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {key === 'clear' ? <Delete className="w-5 h-5 mx-auto" /> : key === 'enter' ? '확인' : key}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            setPin('');
            setFeedback(null);
          }}
          className="mt-4 w-full py-2 text-xs text-slate-500 font-semibold flex items-center justify-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          초기화
        </button>
      </div>
    </div>
  );
};
