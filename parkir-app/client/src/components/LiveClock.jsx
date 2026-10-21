import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { formatLongDate } from '../lib/format';
import { cn } from '../lib/cn';

function formatTime(date) {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

/**
 * Jam live header. Komponen dipisah agar hanya bagian ini yang
 * di-render ulang setiap detik, bukan seluruh Header.
 */
export default function LiveClock({ className }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs',
        className,
      )}
    >
      <Clock3
        size={13}
        strokeWidth={2.2}
        className="shrink-0 text-indigo-500 dark:text-indigo-400"
      />
      <time
        dateTime={now.toISOString()}
        title={formatLongDate(now)}
        className="shrink-0 font-mono font-bold tabular-nums text-slate-700 dark:text-slate-200"
      >
        {formatTime(now)}
      </time>
      <span className="hidden text-slate-300 dark:text-slate-600 sm:inline">·</span>
      <span className="hidden truncate sm:inline">{formatLongDate(now)}</span>
    </div>
  );
}
