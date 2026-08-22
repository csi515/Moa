import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import { StorageService } from '@/services/storage';
import type { Student } from '@/types';
import { KeyRound, RefreshCw } from 'lucide-react';

interface CustomerPinPanelProps {
  student: Student;
}

/** 원생별 출결 PIN 설정 패널 */
export const CustomerPinPanel: React.FC<CustomerPinPanelProps> = ({ student }) => {
  const { showToast } = useApp();
  const org = useOptionalOrganization();
  const organizationId = org?.currentOrganization?.id || 'local-org';

  const [customPin, setCustomPin] = useState('');
  const [revealedPin, setRevealedPin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pinSet = StorageService.hasCustomerPin(student.id);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { pin } = await StorageService.generateCustomerPin(student.id, organizationId);
      setRevealedPin(pin);
      showToast(`${student.name}님 PIN이 발급되었습니다.`, 'success');
    } catch {
      showToast('PIN 발급에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustom = async () => {
    setLoading(true);
    try {
      const result = await StorageService.setCustomerPin(student.id, customPin, organizationId);
      if (result.ok === false) {
        const messages: Record<'invalid_pin_format' | 'pin_already_used', string> = {
          invalid_pin_format: 'PIN은 4~8자리 숫자여야 합니다.',
          pin_already_used: '다른 회원이 사용 중인 PIN입니다.',
        };
        showToast(messages[result.error], 'error');
        return;
      }
      setRevealedPin(customPin);
      setCustomPin('');
      showToast('PIN이 저장되었습니다.', 'success');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    StorageService.clearCustomerPin(student.id);
    setRevealedPin(null);
    setCustomPin('');
    showToast('PIN이 삭제되었습니다.', 'info');
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
      <div className="flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-indigo-600" />
        <h4 className="text-sm font-bold text-slate-900">출결 PIN</h4>
        <span className={`text-[10px] font-bold ml-auto ${pinSet ? 'text-emerald-600' : 'text-rose-500'}`}>
          {pinSet ? '설정됨' : '미설정'}
        </span>
      </div>

      {revealedPin && (
        <div className="bg-indigo-600 text-white rounded-xl p-3 text-center">
          <p className="text-[10px] opacity-80">발급된 PIN (한 번만 표시)</p>
          <p className="text-2xl font-black tracking-[0.3em] font-mono mt-1">{revealedPin}</p>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          placeholder="직접 입력 (4~8자리)"
          value={customPin}
          onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, ''))}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono"
        />
        <button
          type="button"
          disabled={loading || customPin.length < 4}
          onClick={handleSaveCustom}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-50"
        >
          저장
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={handleGenerate}
          className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          PIN 자동 발급
        </button>
        {pinSet && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-600"
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
};
