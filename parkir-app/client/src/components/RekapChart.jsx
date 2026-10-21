import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { formatRupiah, formatShortDate } from '../lib/format';

function RekapTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{formatShortDate(label)}</p>
      <p className="mt-1 text-sm font-extrabold text-amber-600 dark:text-amber-400">{formatRupiah(payload[0].value)}</p>
      <p className="text-[10px] text-slate-400">{payload[0].payload.jumlah} transaksi selesai</p>
    </div>
  );
}

/** Grafik area pendapatan harian untuk dashboard owner dan halaman rekap. */
export default function RekapChart({ data = [], height = 300, total }) {
  const { isDark } = useTheme();
  const computedTotal = total ?? data.reduce((sum, item) => sum + Number(item.pendapatan || 0), 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Grafik Pendapatan Harian</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Hanya transaksi berstatus keluar yang dihitung.</p>
        </div>
        <span className="rounded-xl bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          Total {formatRupiah(computedTotal)}
        </span>
      </div>

      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="rekapRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.38} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.01} />
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
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}rb` : value)}
              tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<RekapTooltip />} cursor={{ stroke: '#f59e0b', strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="pendapatan"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fill="url(#rekapRevenue)"
              isAnimationActive={false}
              activeDot={{ r: 5, strokeWidth: 3, stroke: isDark ? '#0f172a' : '#fff', fill: '#f59e0b' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
