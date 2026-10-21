import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  CarFront,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  RefreshCw,
  ScanLine,
  Wallet,
} from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import {
  elapsedText,
  formatDateTime,
  formatRupiah,
  JENIS_LABEL,
  occupancyColor,
  occupancyPercent,
} from '../../lib/format';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import SearchInput from '../../components/SearchInput';
import EntryModal from '../../components/EntryModal';
import ExitDialog from '../../components/ExitDialog';
import ReceiptModal from '../../components/ReceiptModal';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Skeleton,
  StatCard,
} from '../../components/ui';
import { cn } from '../../lib/cn';

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
      </div>
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

const PAGE_SIZE = 6;

export default function PetugasDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entryOpen, setEntryOpen] = useState(false);
  const [exitTarget, setExitTarget] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [, setTick] = useState(0);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/dashboard/petugas');
      setData(response.data.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Gagal memuat dashboard petugas.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(() => setTick((current) => current + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const activeRows = useMemo(() => {
    const rows = data?.aktif || [];
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => (
      row.plat_nomor.toLowerCase().includes(keyword)
      || row.pemilik.toLowerCase().includes(keyword)
      || row.nama_area.toLowerCase().includes(keyword)
    ));
  }, [data?.aktif, search]);

  const activeMeta = useMemo(() => {
    const total = activeRows.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return {
      total,
      page,
      limit: PAGE_SIZE,
      total_pages: totalPages,
      has_prev: page > 1,
      has_next: page < totalPages,
    };
  }, [activeRows.length, page]);

  const pagedActive = useMemo(
    () => activeRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [activeRows, page],
  );

  function handleExitSuccess(finishedReceipt) {
    setReceipt(finishedReceipt);
    setReceiptOpen(true);
    load();
  }

  if (loading) return <LoadingSkeleton />;
  if (error) return <Card><ErrorState message={error} onRetry={load} /></Card>;
  if (!data) return null;

  const { stats, areas } = data;

  const columns = [
    {
      key: 'plat_nomor',
      label: 'Kendaraan',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <CarFront size={17} />
          </div>
          <div>
            <p className="font-mono text-xs font-extrabold tracking-wider text-slate-900 dark:text-white">{row.plat_nomor}</p>
            <p className="mt-0.5 text-[10px] capitalize text-slate-400">{JENIS_LABEL[row.jenis_kendaraan] || row.jenis_kendaraan} · {row.warna}</p>
          </div>
        </div>
      ),
    },
    { key: 'pemilik', label: 'Pemilik', render: (row) => row.pemilik },
    {
      key: 'nama_area',
      label: 'Area',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <MapPin size={13} className="text-slate-400" />
          {row.nama_area}
        </span>
      ),
    },
    { key: 'waktu_masuk', label: 'Masuk', render: (row) => <span className="text-xs">{formatDateTime(row.waktu_masuk)}</span> },
    {
      key: 'durasi',
      label: 'Durasi',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <Clock3 size={13} />
          {elapsedText(row.waktu_masuk)}
        </span>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <Button size="sm" variant="success" onClick={() => setExitTarget(row)}>
          <ArrowUpRight size={14} />
          Keluar
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-cyan-900 px-6 py-6 text-white shadow-soft sm:px-8 sm:py-7">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 left-1/4 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100 ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              Pos Petugas Aktif
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Siap melayani parkir hari ini</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-emerald-100/75">
              Catat kendaraan masuk, proses pembayaran, dan cetak struk dengan cepat dan akurat.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/petugas/scan"
              className="btn h-11 bg-white px-5 text-emerald-800 shadow-lg hover:bg-emerald-50"
            >
              <ScanLine size={17} />
              Scan Barcode
            </Link>
            <Button
              onClick={() => setEntryOpen(true)}
              className="h-11 bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/20"
            >
              <Plus size={17} />
              Kendaraan Masuk
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CarFront} label="Kendaraan Aktif" value={stats.transaksi_aktif} hint="Sedang berada di area" tone="indigo" />
        <StatCard icon={ArrowUpRight} label="Masuk Hari Ini" value={stats.masuk_hari_ini} hint="Transaksi masuk" tone="emerald" />
        <StatCard icon={CheckCircle2} label="Keluar Hari Ini" value={stats.keluar_hari_ini} hint="Transaksi selesai" tone="amber" />
        <StatCard icon={Wallet} label="Pendapatan Hari Ini" value={formatRupiah(stats.pendapatan_hari_ini)} hint="Dari transaksi keluar" tone="emerald" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Ketersediaan Area</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Status kapasitas area secara langsung.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw size={14} />
            Segarkan
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {areas.map((area) => {
            const percent = occupancyPercent(area.terisi, area.kapasitas);
            const full = Number(area.terisi) >= Number(area.kapasitas);
            const sisa = Number(area.kapasitas) - Number(area.terisi);
            return (
              <Card key={area.id_area} className="relative overflow-hidden p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'grid h-11 w-11 place-items-center rounded-xl',
                      full
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                        : percent >= 65
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
                    )}>
                      <MapPin size={21} />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white">{area.nama_area}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {area.terisi} terisi dari {area.kapasitas}
                      </p>
                    </div>
                  </div>
                  <Badge variant={full ? 'rose' : percent >= 65 ? 'amber' : 'emerald'} dot>
                    {full ? 'Penuh' : `${percent}%`}
                  </Badge>
                </div>

                <div className="mt-5">
                  <div className="mb-1.5 flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>Keterisian</span>
                    <span>{sisa} slot tersedia</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', occupancyColor(percent))}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {full && (
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    <AlertTriangle size={13} />
                    Area penuh, kendaraan baru akan ditolak.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Kendaraan Sedang Parkir</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {data.aktif.length} kendaraan menunggu proses keluar.
            </p>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari plat, pemilik, area..."
            className="w-full sm:w-64"
          />
        </div>

        <DataTable
          columns={columns}
          rows={pagedActive}
          loading={false}
          rowKey={(row) => row.id_parkir}
          emptyTitle={search ? 'Kendaraan tidak ditemukan' : 'Belum ada kendaraan parkir'}
          emptyDescription={search ? 'Coba kata kunci lain.' : 'Klik "Kendaraan Masuk" untuk mencatat kendaraan pertama.'}
          emptyAction={!search ? (
            <Button size="sm" onClick={() => setEntryOpen(true)}>
              <Plus size={15} /> Kendaraan Masuk
            </Button>
          ) : null}
        />
        <Pagination meta={activeMeta} onPage={setPage} />
      </Card>

      <EntryModal
        open={entryOpen}
        onClose={() => setEntryOpen(false)}
        onSuccess={() => load()}
      />

      <ExitDialog
        open={Boolean(exitTarget)}
        onClose={() => setExitTarget(null)}
        transaction={exitTarget}
        onSuccess={handleExitSuccess}
      />

      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        receipt={receipt}
      />
    </div>
  );
}
