import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push('...');
    result.push(page);
  });
  return result;
}

/** Navigasi paginasi server-side. */
export default function Pagination({ meta, onPage, className }) {
  if (!meta || Number(meta.total) === 0) return null;
  const totalPages = Number(meta.total_pages) || 1;
  const currentPage = Number(meta.page) || 1;
  const from = (currentPage - 1) * Number(meta.limit) + 1;
  const to = Math.min(Number(meta.total), currentPage * Number(meta.limit));

  return (
    <div className={cn('flex flex-col gap-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between', className)}>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Menampilkan <span className="font-bold text-slate-700 dark:text-slate-200">{from}-{to}</span> dari{' '}
        <span className="font-bold text-slate-700 dark:text-slate-200">{meta.total}</span> data
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(currentPage - 1)}
          disabled={!meta.has_prev}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>

        {pageNumbers(currentPage, totalPages).map((page, index) => (
          page === '...' ? (
            <span key={`dots-${index}`} className="px-1 text-xs text-slate-400">…</span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPage(page)}
              className={cn(
                'h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition',
                page === currentPage
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
              )}
            >
              {page}
            </button>
          )
        ))}

        <button
          type="button"
          onClick={() => onPage(currentPage + 1)}
          disabled={!meta.has_next}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
