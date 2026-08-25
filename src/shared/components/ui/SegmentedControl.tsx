interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  /** Tailwind 활성 색 (예: bg-indigo-600) */
  activeClassName?: string;
  className?: string;
  /** 모바일에서 전체 너비 */
  fullWidth?: boolean;
  'aria-label'?: string;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  activeClassName = 'bg-indigo-600 text-white',
  className = '',
  fullWidth = false,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`${fullWidth ? 'flex w-full' : 'inline-flex'} rounded-xl border border-slate-200 p-1 bg-white ${className}`}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            id={`segment-${opt.value}`}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 text-xs font-bold rounded-lg min-h-[44px] transition-colors ${
              fullWidth ? 'flex-1 text-center' : ''
            } ${active ? activeClassName : 'text-slate-600 hover:text-slate-900'}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
