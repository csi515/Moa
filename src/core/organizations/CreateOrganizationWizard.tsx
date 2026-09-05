import React, { useState } from 'react';
import { useOrganization } from './OrganizationProvider';
import * as orgService from './services/organizationService';
import {
  Building2,
  X,
  Sparkles,
  CheckCircle2,
  Loader2,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { type IndustryType } from '../industry/types';
import { IndustryPicker } from '../industry/IndustryPicker';
import { StorageService } from '@/services/storage';
import { withAttendanceModuleEnabled } from '@/core/attendance/features';

interface CreateOrganizationWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  initialIndustryType?: IndustryType;
}

type AttendanceChoice = 'pin' | 'manual' | 'later';

export const CreateOrganizationWizard: React.FC<CreateOrganizationWizardProps> = ({
  onComplete,
  onCancel,
  initialIndustryType = 'piano',
}) => {
  const org = useOrganization();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendanceChoice, setAttendanceChoice] = useState<AttendanceChoice>('later');

  const [formData, setFormData] = useState({
    name: '',
    directorName: '',
    phone: '',
    address: '',
    industryType: initialIndustryType,
  });

  const handleStepInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.directorName.trim() || !formData.phone.trim()) {
      setError('필수 항목을 모두 입력해 주세요');
      return;
    }
    setError(null);
    setStep(1);
  };

  const handleFinish = async (choice: AttendanceChoice = attendanceChoice) => {
    setIsSaving(true);
    setError(null);
    const pinEnabled = choice === 'pin';
    try {
      await org.createOrganization(formData.name.trim(), formData.industryType, {
        directorName: formData.directorName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        features: {
          attendance: { enabled: pinEnabled },
        },
      });

      const local = StorageService.getSettings();
      StorageService.saveSettings(withAttendanceModuleEnabled(local, pinEnabled));

      setStep(2);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '학원 등록 중 오류가 발생했습니다');
      setIsSaving(false);
    }
  };

  const steps = [
    { icon: Building2, label: '학원 정보' },
    { icon: KeyRound, label: '출결 방식' },
    { icon: CheckCircle2, label: '완료' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900">새 학원 등록</h2>
          </div>
          {step < 2 && (
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="취소"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <React.Fragment key={s.label}>
                  <div
                    className={`flex items-center gap-1.5 text-xs font-bold ${
                      isActive ? 'text-indigo-600' : isDone ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-indigo-100' : isDone ? 'bg-emerald-50' : 'bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 rounded ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {step === 0 && (
          <form onSubmit={handleStepInfo} className="p-6 space-y-4">
            <p className="text-sm text-slate-500">학원 기본 정보를 입력해 주세요.</p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                업종 <span className="text-rose-500">*</span>
              </label>
              <IndustryPicker
                value={formData.industryType}
                onChange={(industryType) => setFormData({ ...formData, industryType })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                학원명 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: 행복 피아노 학원"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold min-h-[44px]"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                원장님 성함 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: 김원장"
                value={formData.directorName}
                onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                학원 대표 전화번호 <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="예: 010-1234-5678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">학원 주소</label>
              <input
                type="text"
                placeholder="예: 서울시 강남구 테헤란로 123"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none min-h-[44px]"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-slate-400 hover:text-slate-600 min-h-[44px] px-3"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl min-h-[44px]"
              >
                다음
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900">출결 관리 방식을 선택해주세요</h3>
              <p className="text-xs text-slate-500 mt-1">나중에 설정에서 언제든지 변경할 수 있습니다.</p>
            </div>

            <button
              type="button"
              onClick={() => setAttendanceChoice('pin')}
              className={`w-full text-left p-4 rounded-2xl border-2 min-h-[44px] transition-colors ${
                attendanceChoice === 'pin'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                학생 PIN 출결
              </p>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                입구 태블릿에서 학생이 PIN을 입력해 출석합니다. 선생님이 일일이 체크하지 않아도 됩니다.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setAttendanceChoice('manual')}
              className={`w-full text-left p-4 rounded-2xl border-2 min-h-[44px] transition-colors ${
                attendanceChoice === 'manual'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-600" />
                선생님 직접 출결
              </p>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                선생님·관리자가 MOA에서 출석을 직접 처리합니다. PIN·키오스크는 숨겨집니다.
              </p>
            </button>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                disabled={isSaving}
                className="text-xs text-slate-400 hover:text-slate-600 min-h-[44px] px-3"
              >
                이전
              </button>
              <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleFinish('later')}
                  className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl min-h-[44px] disabled:opacity-50"
                >
                  나중에 설정하기
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleFinish(attendanceChoice === 'later' ? 'manual' : attendanceChoice)}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center justify-center gap-1 min-h-[44px] disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> 등록 중...
                    </>
                  ) : (
                    <>
                      등록하기 <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">학원 등록 완료!</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                {formData.name} 등록이 완료되었습니다
                <br />
                앱에서 강의실·교재 초기 설정을 이어서 진행할 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
