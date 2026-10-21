import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { findNavByPath } from '../lib/navigation';
import { getInitials } from '../lib/format';
import { cn } from '../lib/cn';
import LiveClock from './LiveClock';
import { RoleBadge, Spinner } from './ui';

export default function Header({ onOpenMobile }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const currentNav = findNavByPath(user?.role, location.pathname);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    toast.success('Anda telah keluar dari sistem.', 'Logout berhasil');
    navigate('/login', { replace: true });
    setLoggingOut(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-slate-50/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="flex h-[76px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobile}
            className="icon-button -ml-1 lg:hidden"
            aria-label="Buka menu"
          >
            <Menu size={21} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {currentNav?.label || 'Dashboard'}
            </h1>
            <LiveClock className="mt-0.5" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="icon-button relative overflow-hidden"
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={isDark ? 'Mode terang' : 'Mode gelap'}
          >
            <span className={cn('transition-transform duration-500', isDark ? 'rotate-0' : '-rotate-90')}>
              {isDark ? <Moon size={19} /> : <Sun size={19} />}
            </span>
          </button>

          <div className="mx-1 hidden h-8 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

          <div className="flex items-center gap-2.5 rounded-2xl py-1 pl-1 pr-1.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-extrabold text-white shadow-md shadow-indigo-600/20">
              {getInitials(user?.nama_lengkap)}
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="max-w-[150px] truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                {user?.nama_lengkap}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <RoleBadge role={user?.role} />
                <span className="text-[10px] text-slate-400">@{user?.username}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            title="Logout"
          >
            {loggingOut ? <Spinner size={15} /> : <LogOut size={15} />}
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
