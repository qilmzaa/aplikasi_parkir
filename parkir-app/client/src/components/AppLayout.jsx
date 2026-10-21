import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '../lib/cn';

const COLLAPSE_KEY = 'parkir_sidebar_collapsed';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((current) => !current)}
      />

      <div className={cn(
        'min-h-screen transition-[padding] duration-300',
        collapsed ? 'lg:pl-[84px]' : 'lg:pl-72',
      )}>
        <Header onOpenMobile={() => setMobileOpen(true)} />

        <main className="relative mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <div className="pointer-events-none fixed right-0 top-0 -z-0 h-72 w-72 rounded-full bg-indigo-500/5 blur-3xl dark:bg-indigo-500/10" />
          <div className="relative z-10 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
