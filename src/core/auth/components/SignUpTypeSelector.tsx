import type { SignUpType } from '@/types';
import { Building2, GraduationCap, UserCheck, Users } from 'lucide-react';

interface SignUpTypeSelectorProps {
  onSelect: (type: SignUpType) => void;
}

interface TypeCardProps {
  icon: typeof Building2;
  title: string;
  description: string;
  onClick: () => void;
}

function TypeCard({ icon: Icon, title, description, onClick }: TypeCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 active:scale-95"
    >
      <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
        <Icon className="w-7 h-7 text-indigo-600" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 mt-1">{description}</p>
      </div>
    </button>
  );
}

export function SignUpTypeSelector({ onSelect }: SignUpTypeSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">가입 유형을 선택하세요</h2>
        <p className="text-sm text-slate-600 mt-2">
          귀하의 역할에 맞는 계정 유형을 선택해주세요
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TypeCard
          icon={Building2}
          title="사업주"
          description="학원·체육관·시설 운영"
          onClick={() => onSelect('business')}
        />
        <TypeCard
          icon={GraduationCap}
          title="강사"
          description="학원에서 강의 활동"
          onClick={() => onSelect('instructor')}
        />
        <TypeCard
          icon={UserCheck}
          title="고객"
          description="학원·시설 이용"
          onClick={() => onSelect('customer')}
        />
        <TypeCard
          icon={Users}
          title="학부모"
          description="자녀 정보 관리"
          onClick={() => onSelect('guardian')}
        />
      </div>

      <p className="text-xs text-center text-slate-500">
        가입 후 역할은 소속 기관에 따라 자동으로 설정됩니다
      </p>
    </div>
  );
}
