import { NavLink } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  X,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { useAuth } from '../contexts/AuthContext';
import { NAV_BY_ROLE, ROLE_THEME } from '../lib/navigation';
import Logo from './Logo';

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapse }) {
  const { user } = useAuth();
  const items = NAV_BY_ROLE[user?.role] || [];
  const roleTheme = ROLE_THEME[user?.role] || ROLE_THEME.admin;

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/80 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900',
          collapsed ? 'lg:w-[84px]' : 'lg:w-72',
          mobileOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:translate-x-0',
        )}
      >
        <div className={cn(
          'flex h-[76px] shrink-0 items-center border-b border-slate-100 px-5 dark:border-slate-800',
          collapsed ? 'lg:justify-center lg:px-3' : 'justify-between',
        )}>
          <Logo compact={collapsed} />
          <button
            type="button"
            onClick={onCloseMobile}
            className="icon-button lg:hidden"
            aria-label="Tutup menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          {!collapsed && (
            <p className="mb-2.5 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Menu {roleTheme.label}
            </p>
          )}

          <nav className="space-y-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  title={collapsed ? item.label : undefined}
                  onClick={onCloseMobile}
                  className={({ isActive }) => cn(
                    'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200',
                    collapsed && 'lg:justify-center lg:px-2',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-300'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute -left-3 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600 dark:bg-indigo-400 lg:block" />
                      )}
                      <Icon
                        size={19}
                        strokeWidth={isActive ? 2.2 : 1.9}
                        className={cn(
                          'shrink-0 transition-transform group-hover:scale-105',
                          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300',
                        )}
                      />
                      <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800">
          {!collapsed && (
            <div className="mb-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white">
              <div className="mb-2 grid h-8 w-8 place-items-center rounded-xl bg-white/15">
                <ShieldCheck size={17} />
              </div>
              <p className="text-xs font-bold">Akses {roleTheme.label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-indigo-100">
                Setiap aktivitas penting otomatis tercatat pada log sistem.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'hidden w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:flex',
              collapsed && 'justify-center px-2',
            )}
            aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            {!collapsed && <span>Ciutkan menu</span>}
          </button>

          {!collapsed && (
            <div className="mt-1 flex items-center gap-2 px-3.5 py-2 text-[10px] text-slate-400">
              <HelpCircle size={12} />
              Aplikasi Parkir v1.0
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
