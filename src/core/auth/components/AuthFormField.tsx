import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
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
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  name?: string;
  required?: boolean;
  minLength?: number;
  inputClassName?: string;
  trailing?: ReactNode;
  describedBy?: string;
};

/** 아이콘 + 라벨 입력 필드 (모바일 48px 터치·iOS 줌 방지 text-base) */
export function AuthFormField({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  name,
  required,
  minLength,
  inputClassName = AUTH_INPUT_CLASS,
  trailing,
  describedBy,
}: Props) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-slate-600 mb-1.5">
        {label}
        {required && <span className="text-rose-500 sr-only"> (필수)</span>}
      </label>
      <div className="relative">
        <Icon
          className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden
        />
        <input
          id={id}
          name={name ?? id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required={required}
          minLength={minLength}
          aria-describedby={describedBy}
          className={inputClassName}
        />
        {trailing}
      </div>
    </div>
  );
}
