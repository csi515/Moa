import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AUTH_INPUT_CLASS } from '../authUi';

type Props = {
  label: string;
  icon: LucideIcon;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  inputClassName?: string;
  trailing?: ReactNode;
};

/** 아이콘 + 라벨 입력 필드 */
export function AuthFormField({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
  inputClassName = AUTH_INPUT_CLASS,
  trailing,
}: Props) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className={inputClassName}
        />
        {trailing}
      </div>
    </div>
  );
}
