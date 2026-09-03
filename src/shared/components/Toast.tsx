import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm sm:w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border flex items-start justify-between gap-3 text-sm font-semibold ${
                isSuccess
                  ? 'bg-slate-900 text-white border-slate-800'
                  : isError
                  ? 'bg-rose-600 text-white border-rose-700'
                  : isWarning
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-indigo-600 text-white border-indigo-700'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-200 shrink-0 mt-0.5" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-200 shrink-0 mt-0.5" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-indigo-200 shrink-0 mt-0.5" />}
                <span className="leading-relaxed break-words">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center shrink-0 -mr-1 -mt-1"
                aria-label="알림 닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
