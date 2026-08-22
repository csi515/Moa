import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none md:bottom-6 md:right-6">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bg = 'bg-slate-900 text-white';
          let icon = <Info className="w-5 h-5 text-sky-400 shrink-0" />;

          if (toast.type === 'success') {
            bg = 'bg-emerald-900/90 border border-emerald-700 text-emerald-50';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          } else if (toast.type === 'error') {
            bg = 'bg-rose-900/90 border border-rose-700 text-rose-50';
            icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          } else if (toast.type === 'warning') {
            bg = 'bg-amber-900/90 border border-amber-700 text-amber-50';
            icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`${bg} p-3.5 rounded-xl shadow-xl backdrop-blur-md flex items-start gap-3 pointer-events-auto`}
            >
              {icon}
              <div className="flex-1 text-sm">
                {toast.title && <p className="font-semibold text-xs opacity-90">{toast.title}</p>}
                <p className="font-medium leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-300 hover:text-white p-0.5 rounded-lg transition-colors"
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
