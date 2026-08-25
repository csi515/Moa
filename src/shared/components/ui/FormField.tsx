import React, { type ReactNode } from 'react';

interface Props {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/** 설정/폼 필드 라벨 래퍼 */
export const FormField: React.FC<Props> = ({
  label,
  htmlFor,
  required,
  children,
  className = '',
}) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-700 mb-1">
      {label}
      {required && <span className="text-rose-500"> *</span>}
    </label>
    {children}
  </div>
);

export const FORM_CONTROL_CLASS =
  'w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none';
