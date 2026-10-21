import { CalendarDays, ClipboardList, RotateCcw, UserRound } from 'lucide-react';
import useDataTable from '../../hooks/useDataTable';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import SearchInput from '../../components/SearchInput';
import { Button, Card, ErrorState, Input, RoleBadge } from '../../components/ui';
import { formatDate, formatDateTime, getInitials } from '../../lib/format';

export default function LogPage() {
  const table = useDataTable('/log', {
    defaultSort: 'waktu_aktivitas',
    defaultOrder: 'desc',
    limit: 20,
    filters: { dari: '', sampai: '' },
  });

  const columns = [
    {
      key: 'waktu_aktivitas',
      label: 'Waktu',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-700 dark:text-slate-200">{formatDateTime(row.waktu_aktivitas)}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Log #{row.id_log}</p>
        </div>
      ),
    },
    {
      key: 'nama_lengkap',
      label: 'Pengguna',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-[10px] font-extrabold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            {getInitials(row.nama_lengkap)}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{row.nama_lengkap}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">@{row.username}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: (row) => <RoleBadge role={row.role} /> },
    {
      key: 'aktivitas',
      label: 'Aktivitas',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
          {row.aktivitas}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Log Aktivitas</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Jejak audit seluruh aksi penting yang dilakukan pengguna sistem.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
              <div>
                <label htmlFor="log-dari" className="label text-xs">Dari tanggal</label>
                <Input
                  id="log-dari"
                  type="date"
                  value={table.filters.dari || ''}
                  onChange={(event) => table.setFilter('dari', event.target.value)}
                  className="h-10 py-0"
                />
              </div>
              <div>
                <label htmlFor="log-sampai" className="label text-xs">Sampai tanggal</label>
                <Input
                  id="log-sampai"
                  type="date"
                  value={table.filters.sampai || ''}
                  onChange={(event) => table.setFilter('sampai', event.target.value)}
                  className="h-10 py-0"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SearchInput
                value={table.search}
                onChange={table.setSearch}
                placeholder="Cari aktivitas atau user..."
                className="w-full sm:w-64"
              />
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  table.resetFilters({ dari: '', sampai: '' });
                  table.setSearch('');
                }}
              >
                <RotateCcw size={15} />
                Reset
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <CalendarDays size={13} />
            {table.filters.dari || table.filters.sampai
              ? `Filter: ${table.filters.dari ? formatDate(table.filters.dari) : 'awal'} — ${table.filters.sampai ? formatDate(table.filters.sampai) : 'sekarang'}`
              : 'Menampilkan seluruh periode'}
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <ClipboardList size={13} />
            {table.meta?.total ?? 0} aktivitas tercatat
          </div>
        </div>

        {table.error ? (
          <ErrorState message={table.error} onRetry={table.reload} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={table.rows}
              loading={table.loading}
              sort={table.sort}
              order={table.order}
              onSort={table.handleSort}
              rowKey={(row) => row.id_log}
              skeletonRows={8}
              emptyTitle="Log aktivitas kosong"
              emptyDescription="Aktivitas pengguna akan tercatat otomatis di sini."
            />
            <Pagination meta={table.meta} onPage={table.setPage} />
          </>
        )}
      </Card>

      <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <UserRound size={16} className="mt-0.5 shrink-0 text-indigo-500" />
        Audit trail mencatat login, logout, perubahan master data, transaksi masuk/keluar, dan cetak struk.
      </div>
    </div>
  );
}
