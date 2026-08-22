import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
    <p className="text-sm text-slate-500">불러오는 중...</p>
  </div>
);
