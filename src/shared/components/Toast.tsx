import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
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
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
                isSuccess
                  ? 'bg-slate-900 text-white border-slate-800'
                  : isError
                  ? 'bg-rose-600 text-white border-rose-700'
                  : isWarning
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-indigo-600 text-white border-indigo-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isError && <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-indigo-200 shrink-0" />}
                <span className="leading-snug">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
