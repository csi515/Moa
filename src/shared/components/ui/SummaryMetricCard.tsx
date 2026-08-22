import React from 'react';

type SummaryMetricVariant =
  | 'default'
  | 'rose'
  | 'amber'
  | 'emerald'
  | 'purple'
  | 'indigo';

interface SummaryMetricCardProps {
  label: string;
  value: string | number;
  variant?: SummaryMetricVariant;
}

const VARIANT_STYLES: Record<
  SummaryMetricVariant,
  { container: string; label: string; value: string }
> = {
  default: {
    container: 'bg-white border-slate-200',
    label: 'text-slate-500',
    value: 'text-slate-900',
  },
  rose: {
    container: 'bg-rose-50 border-rose-200',
    label: 'text-rose-700 font-semibold',
    value: 'text-rose-900',
  },
  amber: {
    container: 'bg-amber-50 border-amber-200',
    label: 'text-amber-700 font-semibold',
    value: 'text-amber-900',
  },
  emerald: {
    container: 'bg-emerald-50 border-emerald-200',
    label: 'text-emerald-700 font-semibold',
    value: 'text-emerald-900',
  },
  purple: {
    container: 'bg-purple-50 border-purple-200',
    label: 'text-purple-700 font-semibold',
    value: 'text-purple-900',
  },
  indigo: {
    container: 'bg-indigo-50 border-indigo-200',
    label: 'text-indigo-700 font-semibold',
    value: 'text-indigo-900',
  },
};

export const SummaryMetricCard: React.FC<SummaryMetricCardProps> = ({
  label,
  value,
  variant = 'default',
}) => {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className={`p-4 rounded-2xl border shadow-xs ${styles.container}`}>
      <p className={`text-xs ${styles.label}`}>{label}</p>
      <p className={`text-xl font-black mt-1 ${styles.value}`}>{value}</p>
    </div>
  );
};
