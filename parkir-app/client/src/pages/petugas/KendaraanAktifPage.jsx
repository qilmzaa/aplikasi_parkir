import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CarFront,
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
  estimatedCost,
  formatDateTime,
  formatRupiah,
  JENIS_LABEL,
} from '../../lib/format';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import SearchInput from '../../components/SearchInput';
import ExitDialog from '../../components/ExitDialog';
import ReceiptModal from '../../components/ReceiptModal';
import EntryModal from '../../components/EntryModal';
import {
  Button,
  Card,
  ErrorState,
  Skeleton,
  StatCard,
} from '../../components/ui';

const PAGE_SIZE = 8;

export default function KendaraanAktifPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [exitTarget, setExitTarget] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/transaksi/aktif');
      setRows(response.data.data || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Gagal memuat kendaraan aktif.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    if (!keyword) return rows;
    return rows.filter((row) => (
      row.plat_nomor.toLowerCase().includes(keyword)
      || row.pemilik.toLowerCase().includes(keyword)
      || row.nama_area.toLowerCase().includes(keyword)
      || row.jenis_kendaraan.toLowerCase().includes(keyword)
    ));
  }, [rows, search]);

  const meta = useMemo(() => {
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return {
      total,
      page,
      limit: PAGE_SIZE,
      total_pages: totalPages,
      has_prev: page > 1,
      has_next: page < totalPages,
    };
  }, [filtered.length, page]);

  useEffect(() => {
    if (page > meta.total_pages) setPage(meta.total_pages);
  }, [meta.total_pages, page]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const totalEstimate = useMemo(
    () => rows.reduce((total, row) => total + estimatedCost(row.waktu_masuk, row.tarif_per_jam), 0),
    [rows],
  );

  function handleExitSuccess(finishedReceipt) {
    setReceipt(finishedReceipt);
    setReceiptOpen(true);
    load();
  }

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
    { key: 'waktu_masuk', label: 'Waktu Masuk', render: (row) => <span className="text-xs">{formatDateTime(row.waktu_masuk)}</span> },
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
      key: 'estimasi',
      label: 'Estimasi',
      render: (row) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {formatRupiah(estimatedCost(row.waktu_masuk, row.tarif_per_jam))}
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Kendaraan Aktif</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Daftar seluruh kendaraan yang masih berada di area parkir.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/petugas/scan" className="btn btn-secondary h-10 px-4">
            <ScanLine size={16} />
            Scan Barcode
          </Link>
          <Button onClick={() => setEntryOpen(true)}>
            <Plus size={17} />
            Kendaraan Masuk
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CarFront} label="Total Aktif" value={rows.length} hint="Kendaraan di area" tone="indigo" />
        <StatCard icon={Wallet} label="Estimasi Pendapatan" value={formatRupiah(totalEstimate)} hint="Jika semua keluar sekarang" tone="emerald" />
        <StatCard icon={MapPin} label="Area Terpakai" value={new Set(rows.map((row) => row.id_area)).size} hint="Area dengan kendaraan" tone="amber" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari plat, pemilik, area..."
            className="w-full sm:max-w-xs"
          />
          <Button variant="secondary" size="sm" onClick={load}>
            <RefreshCw size={14} />
            Segarkan
          </Button>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14" />)}
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={paged}
              loading={false}
              rowKey={(row) => row.id_parkir}
              emptyTitle={search ? 'Kendaraan tidak ditemukan' : 'Tidak ada kendaraan aktif'}
              emptyDescription={search ? 'Coba kata kunci lainnya.' : 'Semua kendaraan sudah keluar dari area parkir.'}
              emptyAction={!search ? (
                <Button size="sm" onClick={() => setEntryOpen(true)}>
                  <Plus size={15} /> Kendaraan Masuk
                </Button>
              ) : null}
            />
            <Pagination meta={meta} onPage={setPage} />
          </>
        )}
      </Card>

      <EntryModal
        open={entryOpen}
        onClose={() => setEntryOpen(false)}
        onSuccess={load}
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
