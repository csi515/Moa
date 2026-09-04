import React from 'react';

export const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, children, action }) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-bold text-sm text-slate-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
};

export function StatCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-3.5 border min-h-[76px] flex flex-col justify-center ${
        warn
          ? 'bg-rose-50 border-rose-200'
          : 'bg-white border-slate-200'
      }`}
    >
      <p className={`text-[11px] font-semibold ${warn ? 'text-rose-600' : 'text-slate-500'}`}>
        {label}
      </p>
      <p
        className={`text-lg font-black mt-0.5 tabular-nums tracking-tight ${
          warn ? 'text-rose-700' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 text-center">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
