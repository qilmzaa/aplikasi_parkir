import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react';
import { cn } from '../lib/cn';
import { EmptyState } from './ui';

/**
 * Tabel reusable dengan sorting server-side, skeleton loading, dan empty state.
 * columns: [{ key, label, render(row), sortable, sortKey, className, headerClassName }]
 */
export default function DataTable({
  columns,
  rows,
  loading = false,
  sort,
  order,
  onSort,
  rowKey = (row) => row.id,
  emptyTitle = 'Belum ada data',
  emptyDescription,
  emptyAction,
  skeletonRows = 6,
  className,
}) {
  const showEmpty = !loading && (!rows || rows.length === 0);

  return (
    <div className={cn('overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
          <thead className="bg-slate-50/80 dark:bg-slate-950/40">
            <tr>
              {columns.map((column) => {
                const isActive = sort === (column.sortKey || column.key);
                return (
                  <th key={column.key} className={cn('table-th', column.headerClassName)}>
                    {column.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.sortKey || column.key)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-md transition hover:text-indigo-600 dark:hover:text-indigo-400',
                          isActive && 'text-indigo-600 dark:text-indigo-400',
                        )}
                      >
                        {column.label}
                        {isActive
                          ? (order === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)
                          : <ArrowUpDown size={13} className="opacity-50" />}
                      </button>
                    ) : column.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`}>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4">
                    <div
                      className="h-4 animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800"
                      style={{ width: `${45 + ((rowIndex * 13 + column.key.length * 7) % 45)}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="group bg-white transition-colors hover:bg-indigo-50/40 dark:bg-slate-900 dark:hover:bg-slate-800/50"
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn('table-td', column.className)}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEmpty && (
        <EmptyState
          icon={Inbox}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      )}
    </div>
  );
}
