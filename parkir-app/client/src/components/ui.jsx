import { AlertTriangle, Loader2, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '../lib/cn';

const BUTTON_VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
};

const BUTTON_SIZES = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-10 px-4',
  lg: 'h-11 px-5',
  icon: 'h-9 w-9 p-0',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  type = 'button',
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn('btn', BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary, BUTTON_SIZES[size], className)}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function IconButton({ children, className, label, ...props }) {
  return (
    <button
      type="button"
      className={cn('icon-button', className)}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className, ...props }) {
  return <input className={cn('input', className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn('input cursor-pointer appearance-none', className)} {...props}>
      {children}
    </select>
  );
}

export function Field({ label, htmlFor, error, hint, required, children, className }) {
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

const BADGE_VARIANTS = {
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-500/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20',
};

export function Badge({ children, variant = 'slate', dot = false, className }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset',
      BADGE_VARIANTS[variant] || BADGE_VARIANTS.slate,
      className,
    )}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  if (status === 'masuk') return <Badge variant="indigo" dot>Masuk</Badge>;
  if (status === 'keluar') return <Badge variant="emerald" dot>Keluar</Badge>;
  return <Badge>{status || '-'}</Badge>;
}

export function RoleBadge({ role }) {
  const map = {
    admin: { label: 'Admin', variant: 'violet' },
    petugas: { label: 'Petugas', variant: 'indigo' },
    owner: { label: 'Owner', variant: 'amber' },
  };
  const item = map[role] || { label: role || '-', variant: 'slate' };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

export function Card({ children, className }) {
  return <div className={cn('card', className)}>{children}</div>;
}

export function Spinner({ size = 20, className }) {
  return <Loader2 size={size} className={cn('animate-spin text-indigo-600 dark:text-indigo-400', className)} />;
}

export function EmptyState({ icon: Icon = Inbox, title = 'Belum ada data', description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="relative mb-4">
        <div className="absolute inset-0 scale-150 rounded-full bg-indigo-100/70 blur-xl dark:bg-indigo-500/10" />
        <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-500 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Icon size={30} strokeWidth={1.7} />
        </div>
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Gagal memuat data.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400">
        <AlertTriangle size={26} />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-slate-100">Terjadi kesalahan</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw size={15} />
          Coba lagi
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800', className)} />;
}

export function PageLoader() {
  return (
    <div className="grid min-h-[55vh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-card dark:bg-slate-900">
          <Spinner size={26} />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Memuat data...</p>
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'indigo' }) {
  const tones = {
    indigo: {
      icon: 'bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20',
      glow: 'from-indigo-500/10',
    },
    emerald: {
      icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
      glow: 'from-emerald-500/10',
    },
    amber: {
      icon: 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
      glow: 'from-amber-500/10',
    },
    rose: {
      icon: 'bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
      glow: 'from-rose-500/10',
    },
  };
  const style = tones[tone] || tones.indigo;

  return (
    <div className="card group relative overflow-hidden p-5 transition-transform duration-300 hover:-translate-y-1">
      <div className={cn('pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br to-transparent blur-2xl', style.glow)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 truncate text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{value}</p>
          {hint && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
        <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1', style.icon)}>
          {Icon && <Icon size={21} />}
        </div>
      </div>
    </div>
  );
}
