import React from 'react';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
      <h3 className="font-bold text-sm text-slate-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

export function StatCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="bg-white rounded-xl p-3 border border-slate-200">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className={`text-lg font-black ${warn ? 'text-rose-600' : 'text-slate-900'}`}>{value}</p>
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
