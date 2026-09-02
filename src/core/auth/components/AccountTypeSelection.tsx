import type { ComponentType } from 'react';
import { Building2, Users } from 'lucide-react';

interface AccountTypeOption {
  id: 'owner' | 'parent';
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

const OPTIONS: AccountTypeOption[] = [
  {
    id: 'owner',
    title: '사업주 · 원장',
    description: '학원·체육관·어린이집을 운영하고 직원·원생을 관리합니다.',
    icon: Building2,
  },
  {
    id: 'parent',
    title: '학부모 · 보호자',
    description: '자녀의 출결·수납·알림장을 확인하고 학원과 소통합니다.',
    icon: Users,
  },
];

interface AccountTypeSelectionProps {
  onSelect: (type: 'owner' | 'parent') => void;
}

export function AccountTypeSelection({ onSelect }: AccountTypeSelectionProps) {
  return (
    <div className="space-y-3">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className="w-full flex items-start gap-4 p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors text-left min-h-[44px]"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900">{option.title}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{option.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
