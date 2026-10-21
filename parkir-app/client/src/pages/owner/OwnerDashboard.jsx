import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ReceiptText,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import { firstDayOfMonth, formatDate, formatRupiah, todayInput } from '../../lib/format';
import RekapChart from '../../components/RekapChart';
import RekapTable from '../../components/RekapTable';
import {
  Button,
  Card,
  ErrorState,
  Skeleton,
  StatCard,
} from '../../components/ui';

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const dari = firstDayOfMonth();
  const sampai = todayInput();

  async function load(targetPage = page) {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/rekap', {
        params: {
          dari,
          sampai,
          page: targetPage,
          limit: 5,
          sort: 'waktu_masuk',
          order: 'desc',
        },
      });
      setData(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Gagal memuat ringkasan owner.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handlePage(nextPage) {
    setPage(nextPage);
  }

  if (loading && !data) return <LoadingSkeleton />;
  if (error) return <Card><ErrorState message={error} onRetry={() => load(page)} /></Card>;
  if (!data?.data) return null;

  const { summary, chart, tabel } = data.data;
  const meta = data.meta;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-700 px-6 py-6 text-white shadow-soft sm:px-8 sm:py-7">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-yellow-200/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-100 ring-1 ring-white/15">
              <TrendingUp size={12} />
              Ringkasan Bisnis Parkir
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Pendapatan parkir bulan ini</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-amber-100/80">
              Periode {formatDate(dari)} — {formatDate(sampai)}. Pantau performa pendapatan harian dan transaksi selesai.
            </p>
          </div>
          <Link
            to="/owner/rekap"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-orange-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Buka Rekap Lengkap
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} label="Total Pendapatan" value={formatRupiah(summary.total_pendapatan)} hint="Transaksi berstatus keluar" tone="amber" />
        <StatCard icon={ReceiptText} label="Total Transaksi" value={summary.total_transaksi} hint={`${summary.transaksi_masuk} masih masuk`} tone="indigo" />
        <StatCard icon={CheckCircle2} label="Transaksi Selesai" value={summary.transaksi_keluar} hint="Kendaraan sudah keluar" tone="emerald" />
        <StatCard icon={Clock3} label="Rata-rata Durasi" value={`${Number(summary.rata_durasi || 0).toFixed(1)} jam`} hint="Per transaksi selesai" tone="rose" />
      </div>

      <Card className="p-5">
        <RekapChart data={chart} total={summary.total_pendapatan} height={300} />
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Transaksi Terbaru</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {meta.total} transaksi pada periode ini.
            </p>
          </div>
          <Link to="/owner/rekap">
            <Button variant="secondary" size="sm">
              Rekap lengkap
              <ArrowUpRight size={14} />
            </Button>
          </Link>
        </div>
        <RekapTable
          rows={tabel}
          loading={loading}
          meta={meta}
          onPage={handlePage}
          emptyDescription="Belum ada transaksi pada bulan ini."
        />
      </Card>
    </div>
  );
}
