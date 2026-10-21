import { Search, X } from 'lucide-react';
import { cn } from '../lib/cn';

/** Input pencarian dengan ikon dan tombol reset. */
export default function SearchInput({ value, onChange, placeholder = 'Cari data...', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input h-10 pl-10 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          aria-label="Hapus pencarian"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
