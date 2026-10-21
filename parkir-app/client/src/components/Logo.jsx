import { CarFront } from 'lucide-react';
import { cn } from '../lib/cn';

export default function Logo({ compact = false, light = false, className }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(
        'grid shrink-0 place-items-center rounded-2xl shadow-lg',
        compact ? 'h-10 w-10' : 'h-11 w-11',
        light
          ? 'bg-white/15 text-white ring-1 ring-white/20 backdrop-blur'
          : 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-600/25',
      )}>
        <CarFront size={compact ? 20 : 22} strokeWidth={2.1} />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className={cn('truncate text-[15px] font-extrabold tracking-tight', light ? 'text-white' : 'text-slate-900 dark:text-white')}>
            Parkir<span className={light ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}>Guys</span>
          </p>
          <p className={cn('truncate text-[10px] font-semibold uppercase tracking-[0.16em]', light ? 'text-white/55' : 'text-slate-400')}>
            Smart Parking
          </p>
        </div>
      )}
    </div>
  );
}
