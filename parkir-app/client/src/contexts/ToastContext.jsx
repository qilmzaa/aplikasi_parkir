import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../lib/cn';

const ToastContext = createContext(null);

const TOAST_STYLE = {
  success: {
    icon: CheckCircle2,
    wrapper: 'border-emerald-200/80 bg-white text-emerald-700 dark:border-emerald-500/30 dark:bg-slate-900 dark:text-emerald-300',
    iconBox: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  error: {
    icon: AlertCircle,
    wrapper: 'border-rose-200/80 bg-white text-rose-700 dark:border-rose-500/30 dark:bg-slate-900 dark:text-rose-300',
    iconBox: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  },
  info: {
    icon: Info,
    wrapper: 'border-indigo-200/80 bg-white text-indigo-700 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-indigo-300',
    iconBox: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
  },
};

function ToastItem({ toast, onClose }) {
  const style = TOAST_STYLE[toast.type] || TOAST_STYLE.info;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-3.5 shadow-soft animate-slide-in-right',
        style.wrapper,
      )}
      role="status"
    >
      <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', style.iconBox)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {toast.title || (toast.type === 'success' ? 'Berhasil' : toast.type === 'error' ? 'Gagal' : 'Informasi')}
        </p>
        <p className="mt-0.5 whitespace-pre-line text-sm text-slate-500 dark:text-slate-400">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Tutup notifikasi"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback((type, message, title) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current.slice(-4), { id, type, message, title }]);
    const timer = setTimeout(() => remove(id), 4200);
    timers.current.set(id, timer);
    return id;
  }, [remove]);

  const value = useMemo(() => ({
    toast: push,
    success: (message, title) => push('success', message, title),
    error: (message, title) => push('error', message, title),
    info: (message, title) => push('info', message, title),
    remove,
  }), [push, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2.5 sm:right-6 sm:top-6">
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return context;
}
