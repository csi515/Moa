import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = '불러오는 중...' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
    <p className="text-sm text-slate-500">{message}</p>
  </div>
);
