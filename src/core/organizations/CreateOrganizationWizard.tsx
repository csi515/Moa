import React, { useState } from 'react';
import { useOrganization } from './OrganizationProvider';
import * as orgService from './services/organizationService';
import {
  Building2,
  ChevronRight,
  ChevronLeft,
  X,
  DoorOpen,
  Sparkles,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { INDUSTRY_OPTIONS, type IndustryType } from '../industry/types';

interface CreateOrganizationWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  initialIndustryType?: IndustryType;
}

export const CreateOrganizationWizard: React.FC<CreateOrganizationWizardProps> = ({
  onComplete,
  onCancel,
  initialIndustryType = 'piano',
}) => {
  const org = useOrganization();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    directorName: '',
    phone: '',
    address: '',
    roomCount: 1,
    industryType: initialIndustryType,
  });

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.directorName.trim() || !formData.phone.trim()) {
      setError('필수 항목을 모두 입력해 주세요');
      return;
    }
    setError(null);
    setStep(1);
  };

  const handleFinish = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await org.createOrganization(formData.name.trim(), formData.industryType, {
        directorName: formData.directorName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      });
      
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
    { icon: DoorOpen, label: '강의실 설정' },
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
                      isActive
                        ? 'text-indigo-600'
                        : isDone
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isActive
                          ? 'bg-indigo-100'
                          : isDone
                            ? 'bg-emerald-50'
                            : 'bg-slate-100'
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
          <form onSubmit={handleStep1} className="p-6 space-y-4">
            <p className="text-sm text-slate-500">학원 기본 정보를 입력해 주세요.</p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                업종 <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.industryType}
                onChange={(e) =>
                  setFormData({ ...formData, industryType: e.target.value as IndustryType })
                }
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none min-h-[44px]"
              >
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
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
                className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1 min-h-[44px]"
              >
                다음 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-500">학원의 강의실 정보를 입력해 주세요.</p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                강의실(교실) 개수
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      roomCount: Math.max(1, formData.roomCount - 1),
                    })
                  }
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-indigo-600">{formData.roomCount}</div>
                  <div className="text-xs text-slate-500 mt-1">개</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      roomCount: Math.min(20, formData.roomCount + 1),
                    })
                  }
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                피아노실, 연습실 등 수업이 진행되는 공간 개수
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold text-slate-600 flex items-center gap-1 min-h-[44px] disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" /> 이전
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1 min-h-[44px] disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> 등록 중...
                  </>
                ) : (
                  <>
                    완료 <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
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
                <br />곧 관리 화면으로 이동합니다...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
