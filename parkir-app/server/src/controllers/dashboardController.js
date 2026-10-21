import { pool } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

function localDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** GET /api/dashboard/admin - statistik + grafik pendapatan 7 hari. */
export const adminDashboard = asyncHandler(async (req, res) => {
  const [
    [userRows],
    [vehicleRows],
    [areaRows],
    [todayRows],
    [activeRows],
    [roleRows],
    [dailyRows],
    [recentRows],
  ] = await Promise.all([
    pool.execute('SELECT COUNT(*) AS total FROM tb_user'),
    pool.execute('SELECT COUNT(*) AS total FROM tb_kendaraan'),
    pool.execute('SELECT COALESCE(SUM(kapasitas), 0) AS kapasitas, COALESCE(SUM(terisi), 0) AS terisi FROM tb_area_parkir'),
    pool.execute(
      `SELECT COALESCE(SUM(biaya_total), 0) AS pendapatan,
              COUNT(*) AS jumlah
       FROM tb_transaksi
       WHERE status = 'keluar' AND DATE(waktu_keluar) = CURDATE()`,
    ),
    pool.execute("SELECT COUNT(*) AS total FROM tb_transaksi WHERE status = 'masuk'"),
    pool.execute('SELECT role, COUNT(*) AS jumlah FROM tb_user GROUP BY role'),
    pool.execute(
      `SELECT DATE(waktu_keluar) AS tanggal,
              COALESCE(SUM(biaya_total), 0) AS pendapatan,
              COUNT(*) AS jumlah
       FROM tb_transaksi
       WHERE status = 'keluar'
         AND waktu_keluar >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(waktu_keluar)
       ORDER BY tanggal ASC`,
    ),
    pool.execute(
      `SELECT id_parkir, plat_nomor, jenis_kendaraan, nama_area,
              waktu_masuk, waktu_keluar, durasi_jam, biaya_total, status
       FROM v_rekap_transaksi
       ORDER BY id_parkir DESC
       LIMIT 5`,
    ),
  ]);

  const dailyMap = new Map(
    dailyRows.map((row) => [
      String(row.tanggal).slice(0, 10),
      { pendapatan: Number(row.pendapatan), jumlah: Number(row.jumlah) },
    ]),
  );
  const chart = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = localDateString(date);
    const found = dailyMap.get(key) || { pendapatan: 0, jumlah: 0 };
    return {
      tanggal: key,
      pendapatan: found.pendapatan,
      jumlah: found.jumlah,
    };
  });

  const roleCounts = roleRows.reduce((acc, row) => {
    acc[row.role] = Number(row.jumlah);
    return acc;
  }, {});

  return sendSuccess(res, {
    stats: {
      total_user: Number(userRows[0].total),
      total_kendaraan: Number(vehicleRows[0].total),
      total_kapasitas: Number(areaRows[0].kapasitas),
      total_terisi: Number(areaRows[0].terisi),
      pendapatan_hari_ini: Number(todayRows[0].pendapatan),
      transaksi_hari_ini: Number(todayRows[0].jumlah),
      transaksi_aktif: Number(activeRows[0].total),
    },
    users_by_role: {
      admin: roleCounts.admin || 0,
      petugas: roleCounts.petugas || 0,
      owner: roleCounts.owner || 0,
    },
    chart,
    recent: recentRows,
  }, 'Statistik dashboard berhasil diambil');
});

/** GET /api/dashboard/petugas - ringkasan operasional + area + kendaraan aktif. */
export const petugasDashboard = asyncHandler(async (req, res) => {
  const [
    [todayRows],
    [activeRows],
    [areaRows],
    [parkedRows],
  ] = await Promise.all([
    pool.execute(
      `SELECT
         SUM(CASE WHEN status = 'masuk' AND DATE(waktu_masuk) = CURDATE() THEN 1 ELSE 0 END) AS masuk_hari_ini,
         SUM(CASE WHEN status = 'keluar' AND DATE(waktu_keluar) = CURDATE() THEN 1 ELSE 0 END) AS keluar_hari_ini,
         SUM(CASE WHEN status = 'keluar' AND DATE(waktu_keluar) = CURDATE() THEN biaya_total ELSE 0 END) AS pendapatan_hari_ini
       FROM tb_transaksi`,
    ),
    pool.execute("SELECT COUNT(*) AS total FROM tb_transaksi WHERE status = 'masuk'"),
    pool.execute(
      `SELECT id_area, nama_area, kapasitas, terisi
       FROM tb_area_parkir
       ORDER BY nama_area ASC`,
    ),
    pool.execute(
      `SELECT t.id_parkir, CONCAT('PKR-', LPAD(t.id_parkir, 6, '0')) AS kode_tiket,
              t.waktu_masuk, k.id_kendaraan, k.plat_nomor,
              k.jenis_kendaraan, k.warna, k.pemilik, a.nama_area, tr.tarif_per_jam
       FROM tb_transaksi t
       INNER JOIN tb_kendaraan k ON k.id_kendaraan = t.id_kendaraan
       INNER JOIN tb_area_parkir a ON a.id_area = t.id_area
       INNER JOIN tb_tarif tr ON tr.id_tarif = t.id_tarif
       WHERE t.status = 'masuk'
       ORDER BY t.waktu_masuk ASC`,
    ),
  ]);

  const today = todayRows[0];
  return sendSuccess(res, {
    stats: {
      masuk_hari_ini: Number(today.masuk_hari_ini || 0),
      keluar_hari_ini: Number(today.keluar_hari_ini || 0),
      pendapatan_hari_ini: Number(today.pendapatan_hari_ini || 0),
      transaksi_aktif: Number(activeRows[0].total),
    },
    areas: areaRows,
    aktif: parkedRows,
  }, 'Dashboard petugas berhasil diambil');
});
