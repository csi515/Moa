import type { ComponentType } from 'react';
import type { AccountType } from '../types/signup';
import { Building2, GraduationCap, Users } from 'lucide-react';

const ACCOUNT_TYPE_OPTIONS: Array<{
  value: AccountType;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    value: 'owner',
    label: '사업주 (학원 운영)',
    description: '학원을 새로 시작하거나 이미 운영 중인 원장님',
    icon: Building2,
  },
  {
    value: 'teacher',
    label: '강사 / 직원',
    description: '학원에서 수업하거나 근무하는 강사 및 직원',
    icon: GraduationCap,
  },
  {
    value: 'parent',
    label: '학부모',
    description: '자녀의 학원 정보를 확인하고 소통하는 학부모',
    icon: Users,
  },
];

interface SignupAccountTypeSelectorProps {
  accountType: AccountType;
  onAccountTypeChange: (value: AccountType) => void;
}

export function SignupAccountTypeSelector({
  accountType,
  onAccountTypeChange,
}: SignupAccountTypeSelectorProps) {
  return (
    <div className="space-y-3 mb-6">
      <label className="block text-xs font-bold text-slate-600">
        계정 유형을 선택해 주세요
      </label>
      <div className="grid grid-cols-1 gap-2">
        {ACCOUNT_TYPE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = accountType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onAccountTypeChange(option.value)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left min-h-[44px] transition-colors ${
                selected
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <div className="min-w-0">
                <span className="text-sm font-bold block">{option.label}</span>
                <span className="text-[11px] text-slate-500">{option.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
