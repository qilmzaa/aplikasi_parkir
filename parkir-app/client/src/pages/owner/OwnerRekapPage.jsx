import { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileSpreadsheet,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  Wallet,
} from 'lucide-react';
import api, { getErrorMessage, getFileName } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import {
  firstDayOfMonth,
  formatDate,
  formatRupiah,
  todayInput,
} from '../../lib/format';
import RekapChart from '../../components/RekapChart';
import RekapTable from '../../components/RekapTable';
import SearchInput from '../../components/SearchInput';
import {
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  Skeleton,
  StatCard,
} from '../../components/ui';

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
      </div>
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

export default function OwnerRekapPage() {
  const toast = useToast();
  const [draft, setDraft] = useState({ dari: firstDayOfMonth(), sampai: todayInput() });
  const [applied, setApplied] = useState({ dari: firstDayOfMonth(), sampai: todayInput() });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/rekap', {
          params: {
            dari: applied.dari,
            sampai: applied.sampai,
            page,
            limit: 10,
            search: debouncedSearch || undefined,
            sort: 'waktu_masuk',
            order: 'desc',
          },
          signal: controller.signal,
        });
        if (!active) return;
        setData(response.data);
      } catch (requestError) {
        if (requestError.code === 'ERR_CANCELED' || !active) return;
        setError(getErrorMessage(requestError, 'Gagal memuat rekap transaksi.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [applied.dari, applied.sampai, page, debouncedSearch, reloadKey]);

  function applyRange(nextRange = draft, showToast = true) {
    if (!nextRange.dari || !nextRange.sampai) {
      toast.error('Tanggal awal dan akhir wajib dipilih.');
      return;
    }
    if (nextRange.dari > nextRange.sampai) {
      toast.error('Tanggal awal tidak boleh lebih besar dari tanggal akhir.');
      return;
    }
    setApplied({ ...nextRange });
    setPage(1);
    setReloadKey((current) => current + 1);
    if (showToast) toast.success('Rentang tanggal rekap diterapkan.');
  }

  function applyPreset(days) {
    const end = new Date();
    const start = new Date();
    if (days === 0) {
      start.setDate(start.getDate() - 6);
    } else {
      start.setDate(1);
    }
    const range = {
      dari: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
      sampai: todayInput(),
    };
    setDraft(range);
    applyRange(range, false);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const response = await api.get('/rekap/export', {
        params: { dari: applied.dari, sampai: applied.sampai },
        responseType: 'blob',
      });
      const filename = getFileName(
        response.headers['content-disposition'],
        `rekap-parkir-${applied.dari}-${applied.sampai}.csv`,
      );
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('File CSV berhasil diunduh.', 'Ekspor selesai');
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Gagal mengekspor rekap.'));
    } finally {
      setExporting(false);
    }
  }

  if (loading && !data) return <LoadingSkeleton />;

  const summary = data?.data?.summary;
  const chart = data?.data?.chart || [];
  const table = data?.data?.tabel || [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Rekap Transaksi</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pilih rentang tanggal, tinjau pendapatan, lalu ekspor laporan ke CSV.
          </p>
        </div>
        <Button variant="secondary" onClick={handleExport} loading={exporting} className="w-fit">
          <Download size={16} />
          Ekspor CSV
        </Button>
      </div>

      <Card className="p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            applyRange();
          }}
          className="space-y-4"
        >
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:max-w-lg">
              <Field label="Tanggal Awal" htmlFor="rekap-dari">
                <Input
                  id="rekap-dari"
                  type="date"
                  value={draft.dari}
                  max={draft.sampai}
                  onChange={(event) => setDraft((current) => ({ ...current, dari: event.target.value }))}
                  className="h-10 py-0"
                />
              </Field>
              <Field label="Tanggal Akhir" htmlFor="rekap-sampai">
                <Input
                  id="rekap-sampai"
                  type="date"
                  value={draft.sampai}
                  min={draft.dari}
                  onChange={(event) => setDraft((current) => ({ ...current, sampai: event.target.value }))}
                  className="h-10 py-0"
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <Button type="submit" className="h-10">
                <Search size={15} />
                Terapkan
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-10"
                onClick={() => {
                  const range = { dari: firstDayOfMonth(), sampai: todayInput() };
                  setDraft(range);
                  applyRange(range, false);
                  setSearch('');
                }}
              >
                <RotateCcw size={15} />
                Bulan Ini
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Cepat:</span>
            <button type="button" onClick={() => applyPreset(7)} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300">
              7 hari terakhir
            </button>
            <button type="button" onClick={() => applyPreset(0)} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300">
              Bulan ini
            </button>
            <span className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400">
              <CalendarDays size={13} />
              {formatDate(applied.dari)} — {formatDate(applied.sampai)}
            </span>
          </div>
        </form>
      </Card>

      {error ? (
        <Card><ErrorState message={error} onRetry={() => setReloadKey((current) => current + 1)} /></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Wallet} label="Total Pendapatan" value={formatRupiah(summary?.total_pendapatan || 0)} hint="Transaksi selesai" tone="amber" />
            <StatCard icon={ReceiptText} label="Total Transaksi" value={summary?.total_transaksi || 0} hint={`${summary?.transaksi_masuk || 0} masih masuk`} tone="indigo" />
            <StatCard icon={CheckCircle2} label="Transaksi Selesai" value={summary?.transaksi_keluar || 0} hint="Kendaraan sudah keluar" tone="emerald" />
            <StatCard icon={Clock3} label="Rata-rata Durasi" value={`${Number(summary?.rata_durasi || 0).toFixed(1)} jam`} hint="Per transaksi selesai" tone="rose" />
          </div>

          <Card className="p-5">
            <RekapChart data={chart} total={summary?.total_pendapatan || 0} height={310} />
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Detail Transaksi</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {meta?.total || 0} transaksi pada rentang ini.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Cari plat, area, jenis..."
                  className="w-full sm:w-60"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setReloadKey((current) => current + 1)}
                  aria-label="Segarkan data"
                >
                  <RefreshCw size={16} />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-950/20">
              <FileSpreadsheet size={13} />
              Pendapatan hanya menjumlahkan transaksi yang sudah selesai.
            </div>

            <RekapTable
              rows={table}
              loading={loading}
              meta={meta}
              onPage={setPage}
              emptyDescription="Tidak ada transaksi yang cocok dengan periode atau pencarian."
            />
          </Card>
        </>
      )}
    </div>
  );
}
