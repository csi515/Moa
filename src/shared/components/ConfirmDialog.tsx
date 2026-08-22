import React from 'react';
import { useApp } from '@/context/AppContext';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmDialog: React.FC = () => {
  const { confirmDialog, closeConfirmDialog } = useApp();

  if (!confirmDialog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              confirmDialog.isDestructive ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{confirmDialog.title}</h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {confirmDialog.message}
        </p>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={closeConfirmDialog}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {confirmDialog.cancelText || '취소'}
          </button>
          <button
            type="button"
            onClick={() => {
              confirmDialog.onConfirm();
              closeConfirmDialog();
            }}
            className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-md cursor-pointer ${
              confirmDialog.isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {confirmDialog.confirmText || '확인'}
          </button>
        </div>
      </div>
    </div>
  );
};
