import { pool } from '../config/db.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildMeta, getPagination, getSorting } from '../utils/pagination.js';
import { sendSuccess } from '../utils/response.js';
import { csvCell, dateOnly, text } from '../utils/validation.js';

const SORT_MAP = {
  waktu_masuk: 'waktu_masuk',
  waktu_keluar: 'waktu_keluar',
  plat_nomor: 'plat_nomor',
  biaya_total: 'biaya_total',
  durasi_jam: 'durasi_jam',
  status: 'status',
  id_parkir: 'id_parkir',
};

function localDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Menyiapkan rentang tanggal, default awal bulan sampai hari ini. */
function resolveDateRange(query) {
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
  const dari = text(query.dari) ? dateOnly(query.dari, 'Tanggal awal') : localDateString(defaultFrom);
  const sampai = text(query.sampai) ? dateOnly(query.sampai, 'Tanggal akhir') : localDateString(today);

  if (dari > sampai) {
    throw new AppError(400, 'Tanggal awal tidak boleh lebih besar dari tanggal akhir', 'VALIDATION_ERROR');
  }

  const start = new Date(`${dari}T00:00:00`);
  const end = new Date(`${sampai}T00:00:00`);
  const dayCount = Math.floor((end - start) / 86400000) + 1;
  if (dayCount > 366) {
    throw new AppError(400, 'Rentang rekap maksimal 366 hari', 'VALIDATION_ERROR');
  }

  return { dari, sampai, dayCount };
}

function buildSearchFilter(search) {
  if (!search) return { sql: '', params: [] };
  const like = `%${search}%`;
  return {
    sql: 'AND (plat_nomor LIKE ? OR nama_area LIKE ? OR jenis_kendaraan LIKE ?)',
    params: [like, like, like],
  };
}

/**
 * GET /api/rekap?dari=YYYY-MM-DD&sampai=YYYY-MM-DD
 * Output: ringkasan, grafik pendapatan harian, dan tabel rekap terpaginasi.
 * Owner hanya membaca dari view v_rekap_transaksi.
 */
export const getRekap = asyncHandler(async (req, res) => {
  const { dari, sampai, dayCount } = resolveDateRange(req.query);
  const { page, limit, offset } = getPagination(req, 10, 100);
  const { sort, order } = getSorting(req, SORT_MAP, 'waktu_masuk');
  const search = text(req.query.search);
  const searchFilter = buildSearchFilter(search);

  const [[summaryRows], [dailyRows], [countRows], [rows]] = await Promise.all([
    pool.execute(
      `SELECT
         COUNT(*) AS total_transaksi,
         SUM(CASE WHEN status = 'masuk' THEN 1 ELSE 0 END) AS transaksi_masuk,
         SUM(CASE WHEN status = 'keluar' THEN 1 ELSE 0 END) AS transaksi_keluar,
         COALESCE(SUM(CASE WHEN status = 'keluar' THEN biaya_total ELSE 0 END), 0) AS total_pendapatan,
         COALESCE(AVG(CASE WHEN status = 'keluar' THEN durasi_jam END), 0) AS rata_durasi
       FROM v_rekap_transaksi
       WHERE DATE(waktu_masuk) BETWEEN ? AND ?`,
      [dari, sampai],
    ),
    pool.execute(
      `SELECT DATE(waktu_keluar) AS tanggal,
              COALESCE(SUM(biaya_total), 0) AS pendapatan,
              COUNT(*) AS jumlah
       FROM v_rekap_transaksi
       WHERE status = 'keluar'
         AND DATE(waktu_keluar) BETWEEN ? AND ?
       GROUP BY DATE(waktu_keluar)
       ORDER BY tanggal ASC`,
      [dari, sampai],
    ),
    pool.execute(
      `SELECT COUNT(*) AS total
       FROM v_rekap_transaksi
       WHERE DATE(waktu_masuk) BETWEEN ? AND ? ${searchFilter.sql}`,
      [dari, sampai, ...searchFilter.params],
    ),
    pool.execute(
      `SELECT id_parkir, plat_nomor, jenis_kendaraan, nama_area,
              waktu_masuk, waktu_keluar, durasi_jam, biaya_total, status
       FROM v_rekap_transaksi
       WHERE DATE(waktu_masuk) BETWEEN ? AND ? ${searchFilter.sql}
       ORDER BY ${sort} ${order}
       LIMIT ? OFFSET ?`,
      [dari, sampai, ...searchFilter.params, limit, offset],
    ),
  ]);

  const dailyMap = new Map(
    dailyRows.map((row) => [
      String(row.tanggal).slice(0, 10),
      { pendapatan: Number(row.pendapatan), jumlah: Number(row.jumlah) },
    ]),
  );

  const chart = [];
  for (let index = 0; index < dayCount; index += 1) {
    const date = new Date(`${dari}T00:00:00`);
    date.setDate(date.getDate() + index);
    const key = localDateString(date);
    const found = dailyMap.get(key) || { pendapatan: 0, jumlah: 0 };
    chart.push({ tanggal: key, ...found });
  }

  const summary = summaryRows[0];
  return sendSuccess(res, {
    periode: { dari, sampai },
    summary: {
      total_pendapatan: Number(summary.total_pendapatan),
      total_transaksi: Number(summary.total_transaksi),
      transaksi_masuk: Number(summary.transaksi_masuk),
      transaksi_keluar: Number(summary.transaksi_keluar),
      rata_durasi: Number(summary.rata_durasi),
    },
    chart,
    tabel: rows,
  }, 'Rekap transaksi berhasil diambil', 200, buildMeta(Number(countRows[0].total), page, limit));
});

/**
 * GET /api/rekap/export?dari=YYYY-MM-DD&sampai=YYYY-MM-DD
 * Output: file CSV seluruh transaksi pada rentang tanggal (maks. 10.000 baris).
 */
export const exportRekapCsv = asyncHandler(async (req, res) => {
  const { dari, sampai } = resolveDateRange(req.query);

  const [rows] = await pool.execute(
    `SELECT id_parkir, plat_nomor, jenis_kendaraan, nama_area,
            waktu_masuk, waktu_keluar, durasi_jam, biaya_total, status
     FROM v_rekap_transaksi
     WHERE DATE(waktu_masuk) BETWEEN ? AND ?
     ORDER BY waktu_masuk ASC
     LIMIT 10000`,
    [dari, sampai],
  );

  const header = [
    'ID Parkir', 'Plat Nomor', 'Jenis Kendaraan', 'Area', 'Waktu Masuk',
    'Waktu Keluar', 'Durasi (Jam)', 'Biaya Total', 'Status',
  ];

  const lines = [
    header.join(','),
    ...rows.map((row) => [
      row.id_parkir,
      row.plat_nomor,
      row.jenis_kendaraan,
      row.nama_area,
      row.waktu_masuk,
      row.waktu_keluar,
      row.durasi_jam,
      row.biaya_total,
      row.status,
    ].map(csvCell).join(',')),
  ];

  const csv = `\uFEFF${lines.join('\r\n')}`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="rekap-parkir-${dari}-sampai-${sampai}.csv"`,
  );
  return res.status(200).send(csv);
});
