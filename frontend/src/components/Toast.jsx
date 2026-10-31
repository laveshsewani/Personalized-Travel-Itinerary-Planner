import React from 'react';
import { useTripStore } from '../store/tripStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = () => {
  const toast = useTripStore((state) => state.toast);
  const setToast = useTripStore((state) => state.setToast);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-slide-up bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-w-md">
      {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
      {isError && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
      {!isSuccess && !isError && <Info className="w-5 h-5 text-brand-500 shrink-0" />}
      
      <p className="text-sm font-medium pr-2">{toast.message}</p>
      
      <button
        onClick={() => setToast(null)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-auto p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
