import { CarFront, MapPin } from 'lucide-react';
import { formatDateTime, formatRupiah, JENIS_LABEL } from '../lib/format';
import DataTable from './DataTable';
import Pagination from './Pagination';
import { StatusBadge } from './ui';

const COLUMNS = [
  {
    key: 'id_parkir',
    label: 'ID',
    render: (row) => <span className="font-mono text-xs font-bold text-slate-400">#{row.id_parkir}</span>,
  },
  {
    key: 'plat_nomor',
    label: 'Kendaraan',
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <CarFront size={15} />
        </div>
        <div>
          <p className="font-mono text-xs font-extrabold tracking-wider text-slate-900 dark:text-white">{row.plat_nomor}</p>
          <p className="mt-0.5 text-[10px] capitalize text-slate-400">{JENIS_LABEL[row.jenis_kendaraan] || row.jenis_kendaraan}</p>
        </div>
      </div>
    ),
  },
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
  { key: 'waktu_keluar', label: 'Keluar', render: (row) => <span className="text-xs">{formatDateTime(row.waktu_keluar)}</span> },
  {
    key: 'durasi_jam',
    label: 'Durasi',
    render: (row) => <span className="text-xs font-semibold">{row.durasi_jam ? `${row.durasi_jam} jam` : '-'}</span>,
  },
  {
    key: 'biaya_total',
    label: 'Biaya',
    render: (row) => (
      <span className="font-bold text-slate-800 dark:text-slate-100">
        {row.biaya_total ? formatRupiah(row.biaya_total) : '-'}
      </span>
    ),
  },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
];

/** Tabel rekap transaksi + paginasi. */
export default function RekapTable({ rows, loading, meta, onPage, emptyDescription }) {
  return (
    <>
      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        rowKey={(row) => row.id_parkir}
        emptyTitle="Tidak ada transaksi pada periode ini"
        emptyDescription={emptyDescription || 'Coba ubah rentang tanggal atau kata kunci pencarian.'}
        skeletonRows={7}
      />
      <Pagination meta={meta} onPage={onPage} />
    </>
  );
}
