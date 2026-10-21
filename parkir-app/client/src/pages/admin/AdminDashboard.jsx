import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpRight,
  CarFront,
  ClipboardList,
  ParkingCircle,
  ShieldCheck,
  Tags,
  Users,
  Wallet,
} from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatRupiah, formatShortDate, occupancyPercent } from '../../lib/format';
import { useTheme } from '../../contexts/ThemeContext';
import DataTable from '../../components/DataTable';
import { Button, Card, ErrorState, Skeleton, StatCard, StatusBadge } from '../../components/ui';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{formatShortDate(label)}</p>
      <p className="mt-1 text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
        {formatRupiah(payload[0].value)}
      </p>
      <p className="text-[10px] text-slate-400">{payload[0].payload.jumlah} transaksi</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Skeleton className="h-80 xl:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isDark } = useTheme();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/dashboard/admin');
      setData(response.data.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Gagal memuat statistik dashboard.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <Card><ErrorState message={error} onRetry={load} /></Card>;
  if (!data) return null;

  const { stats, users_by_role: roles, chart, recent } = data;
  const percentage = occupancyPercent(stats.total_terisi, stats.total_kapasitas);

  const recentColumns = [
    {
      key: 'plat_nomor',
      label: 'Kendaraan',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{row.plat_nomor}</p>
          <p className="mt-0.5 text-[11px] capitalize text-slate-400">{row.jenis_kendaraan}</p>
        </div>
      ),
    },
    { key: 'nama_area', label: 'Area', render: (row) => row.nama_area },
    { key: 'waktu_masuk', label: 'Masuk', render: (row) => formatDateTime(row.waktu_masuk) },
    {
      key: 'biaya_total',
      label: 'Biaya',
      render: (row) => (
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {row.biaya_total ? formatRupiah(row.biaya_total) : '-'}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-900 px-6 py-6 text-white shadow-soft sm:px-8 sm:py-7">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-100 ring-1 ring-white/15">
              <ShieldCheck size={12} />
              Pusat Kendali Admin
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Operasional parkir dalam satu pandangan</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-indigo-100/75">
              Pantau kapasitas, pendapatan, dan aktivitas terbaru. Kelola seluruh master data dari menu samping.
            </p>
          </div>
          <Link
            to="/admin/kendaraan"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Kelola kendaraan
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total User" value={stats.total_user} hint={`${roles.admin} admin · ${roles.petugas} petugas · ${roles.owner} owner`} tone="indigo" />
        <StatCard icon={CarFront} label="Total Kendaraan" value={stats.total_kendaraan} hint="Terdaftar di sistem" tone="emerald" />
        <StatCard icon={ParkingCircle} label="Kapasitas Terisi" value={`${stats.total_terisi} / ${stats.total_kapasitas}`} hint={`${percentage}% dari total kapasitas`} tone={percentage >= 90 ? 'rose' : percentage >= 65 ? 'amber' : 'indigo'} />
        <StatCard icon={Wallet} label="Pendapatan Hari Ini" value={formatRupiah(stats.pendapatan_hari_ini)} hint={`${stats.transaksi_hari_ini} transaksi selesai`} tone="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Pendapatan 7 Hari Terakhir</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total biaya dari transaksi yang telah selesai.</p>
            </div>
            <span className="rounded-xl bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              {formatRupiah(chart.reduce((total, item) => total + item.pendapatan, 0))}
            </span>
          </div>
          <div className="h-[285px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis
                  dataKey="tanggal"
                  tickFormatter={formatShortDate}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}rb` : value)}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#6366f1', strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="pendapatan"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#adminRevenue)"
                  isAnimationActive={false}
                  activeDot={{ r: 5, strokeWidth: 3, stroke: isDark ? '#0f172a' : '#fff', fill: '#6366f1' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Keterisian Area</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Kapasitas seluruh area parkir.</p>

          <div className="relative mx-auto mt-6 grid h-40 w-40 place-items-center">
            <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10" className="stroke-slate-100 dark:stroke-slate-800" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                stroke={percentage >= 90 ? '#f43f5e' : percentage >= 65 ? '#f59e0b' : '#10b981'}
                strokeDasharray={`${(percentage / 100) * 314} 314`}
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{percentage}%</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">terisi</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Kendaraan aktif</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{stats.transaksi_aktif}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Sisa kapasitas</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.total_kapasitas - stats.total_terisi}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Transaksi hari ini</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{stats.transaksi_hari_ini}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link to="/admin/tarif" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-[11px] font-bold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
              <Tags size={16} className="mx-auto mb-1.5" />
              Atur Tarif
            </Link>
            <Link to="/admin/log" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-[11px] font-bold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
              <ClipboardList size={16} className="mx-auto mb-1.5" />
              Lihat Log
            </Link>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Transaksi Terbaru</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">5 aktivitas parkir paling baru.</p>
          </div>
          <Link to="/admin/log">
            <Button variant="ghost" size="sm">Lihat aktivitas <ArrowUpRight size={14} /></Button>
          </Link>
        </div>
        <DataTable
          columns={recentColumns}
          rows={recent}
          rowKey={(row) => row.id_parkir}
          emptyTitle="Belum ada transaksi"
          emptyDescription="Transaksi akan muncul setelah petugas mencatat kendaraan masuk."
        />
      </Card>
    </div>
  );
}
