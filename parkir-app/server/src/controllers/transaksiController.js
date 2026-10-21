import { pool } from '../config/db.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { recordActivity } from '../utils/activity.js';
import { sendCreated, sendSuccess } from '../utils/response.js';
import { positiveInt, requireFields, routeId, text } from '../utils/validation.js';

const RECEIPT_SELECT = `
  SELECT
    t.id_parkir,
    CONCAT('PKR-', LPAD(t.id_parkir, 6, '0')) AS kode_tiket,
    k.plat_nomor,
    k.jenis_kendaraan,
    k.warna,
    k.pemilik,
    a.nama_area,
    t.waktu_masuk,
    t.waktu_keluar,
    t.durasi_jam,
    t.biaya_total,
    t.status,
    tr.tarif_per_jam,
    u.nama_lengkap AS nama_petugas
  FROM tb_transaksi t
  INNER JOIN tb_kendaraan k ON k.id_kendaraan = t.id_kendaraan
  INNER JOIN tb_area_parkir a ON a.id_area = t.id_area
  INNER JOIN tb_tarif tr ON tr.id_tarif = t.id_tarif
  INNER JOIN tb_user u ON u.id_user = t.id_user
  WHERE t.id_parkir = ?
  LIMIT 1
`;

/** Normalisasi barcode: huruf besar dan tanpa spasi. */
function normalizeBarcode(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Barcode tiket: PKR-000006, TRX-6, TIKET-6, atau angka saja.
 * Mengembalikan ID parkir atau null jika bukan format tiket.
 */
function parseTicketCode(value) {
  const normalized = normalizeBarcode(value);
  const prefixed = /^(?:PKR|TRX|TIKET)[-:]?0*(\d+)$/.exec(normalized);
  if (prefixed) return Number(prefixed[1]);
  if (/^\d{1,10}$/.test(normalized)) return Number(normalized);
  return null;
}

/** Mengambil satu struk/transaksi berdasarkan ID. */
async function getReceipt(id, executor = pool) {
  const [rows] = await executor.execute(RECEIPT_SELECT, [id]);
  return rows[0] || null;
}

/** Memilih area otomatis: cocokkan jenis kendaraan pada nama area, lalu sisa slot terbesar. */
async function findAvailableArea(connection, vehicle) {
  const jenis = String(vehicle.jenis_kendaraan || '').toLowerCase();
  const keyword = `%${jenis}%`;

  const [rows] = await connection.execute(
    `SELECT id_area, nama_area, kapasitas, terisi
     FROM tb_area_parkir
     WHERE terisi < kapasitas
     ORDER BY
       CASE WHEN LOWER(nama_area) LIKE ? THEN 0 ELSE 1 END,
       (kapasitas - terisi) DESC,
       id_area ASC
     FOR UPDATE`,
    [keyword],
  );

  return rows[0] || null;
}

/**
 * Inti transaksi masuk. Dipakai oleh form manual dan scan barcode.
 * Jika idArea null, area dipilih otomatis sesuai jenis kendaraan dan kapasitas.
 */
async function createEntryRecord({ idKendaraan, idArea = null, userId }) {
  const connection = await pool.getConnection();
  let newId = null;

  try {
    await connection.beginTransaction();

    const [vehicleRows] = await connection.execute(
      `SELECT id_kendaraan, plat_nomor, jenis_kendaraan, pemilik
       FROM tb_kendaraan WHERE id_kendaraan = ? LIMIT 1 FOR UPDATE`,
      [idKendaraan],
    );
    const vehicle = vehicleRows[0];
    if (!vehicle) {
      throw new AppError(404, 'Kendaraan tidak ditemukan', 'NOT_FOUND');
    }

    const [activeRows] = await connection.execute(
      `SELECT id_parkir FROM tb_transaksi
       WHERE id_kendaraan = ? AND status = 'masuk'
       LIMIT 1 FOR UPDATE`,
      [idKendaraan],
    );
    if (activeRows.length > 0) {
      throw new AppError(409, `Kendaraan ${vehicle.plat_nomor} masih berada di area parkir`, 'VEHICLE_STILL_PARKED');
    }

    let area = null;
    if (idArea) {
      const [areaRows] = await connection.execute(
        `SELECT id_area, nama_area, kapasitas, terisi
         FROM tb_area_parkir WHERE id_area = ? LIMIT 1 FOR UPDATE`,
        [idArea],
      );
      area = areaRows[0];
      if (!area) {
        throw new AppError(404, 'Area parkir tidak ditemukan', 'NOT_FOUND');
      }
      if (Number(area.terisi) >= Number(area.kapasitas)) {
        throw new AppError(409, `Area ${area.nama_area} sudah penuh (${area.terisi}/${area.kapasitas})`, 'AREA_FULL');
      }
    } else {
      area = await findAvailableArea(connection, vehicle);
      if (!area) {
        throw new AppError(409, `Semua area parkir untuk kendaraan ${vehicle.plat_nomor} sedang penuh`, 'AREA_FULL');
      }
    }

    const [tarifRows] = await connection.execute(
      `SELECT id_tarif, tarif_per_jam FROM tb_tarif
       WHERE jenis_kendaraan = ? LIMIT 1`,
      [vehicle.jenis_kendaraan],
    );
    const tarif = tarifRows[0];
    if (!tarif) {
      throw new AppError(400, `Tarif untuk jenis ${vehicle.jenis_kendaraan} belum diatur`, 'TARIF_NOT_FOUND');
    }

    const [insertResult] = await connection.execute(
      `INSERT INTO tb_transaksi
        (id_kendaraan, waktu_masuk, waktu_keluar, id_tarif, durasi_jam,
         biaya_total, status, id_user, id_area)
       VALUES (?, NOW(), NULL, ?, NULL, NULL, 'masuk', ?, ?)`,
      [idKendaraan, tarif.id_tarif, userId, area.id_area],
    );
    newId = insertResult.insertId;

    await connection.execute(
      'UPDATE tb_area_parkir SET terisi = terisi + 1 WHERE id_area = ?',
      [area.id_area],
    );

    await recordActivity(
      userId,
      `Transaksi masuk ${vehicle.plat_nomor}`,
      connection,
    );

    await connection.commit();
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // Abaikan error rollback; error asli tetap dilempar.
    }
    throw error;
  } finally {
    connection.release();
  }

  return getReceipt(newId);
}

/** Inti transaksi keluar: panggil stored procedure, lalu ambil struk terbaru. */
async function processExitRecord(id, userId) {
  try {
    await pool.query('CALL sp_parkir_keluar(?, ?)', [id, userId]);
  } catch (error) {
    if (error.sqlState === '45000' || error.errno === 1644) {
      throw new AppError(400, error.sqlMessage || 'Transaksi tidak dapat diproses', 'PROCEDURE_ERROR');
    }
    throw error;
  }

  const receipt = await getReceipt(id);
  if (!receipt) {
    throw new AppError(404, 'Transaksi tidak ditemukan', 'NOT_FOUND');
  }

  return receipt;
}


/**
 * GET /api/transaksi/opsi
 * Output: area, tarif, dan semua kendaraan dengan penanda sedang parkir.
 */
export const getTransactionOptions = asyncHandler(async (req, res) => {
  const [[areas], [tarif], [kendaraan]] = await Promise.all([
    pool.execute(
      `SELECT id_area, nama_area, kapasitas, terisi
       FROM tb_area_parkir ORDER BY nama_area ASC`,
    ),
    pool.execute(
      `SELECT id_tarif, jenis_kendaraan, tarif_per_jam
       FROM tb_tarif ORDER BY jenis_kendaraan ASC`,
    ),
    pool.execute(
      `SELECT k.id_kendaraan, k.plat_nomor, k.jenis_kendaraan, k.warna, k.pemilik,
              EXISTS(
                SELECT 1 FROM tb_transaksi t
                WHERE t.id_kendaraan = k.id_kendaraan AND t.status = 'masuk'
              ) AS sedang_parkir
       FROM tb_kendaraan k
       ORDER BY k.plat_nomor ASC`,
    ),
  ]);

  return sendSuccess(res, {
    areas,
    tarif,
    kendaraan: kendaraan.map((item) => ({
      ...item,
      sedang_parkir: Boolean(item.sedang_parkir),
    })),
  }, 'Opsi transaksi berhasil diambil');
});

/** GET /api/transaksi/aktif - kendaraan yang saat ini masih di dalam area. */
export const listActiveTransactions = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT
       t.id_parkir,
       CONCAT('PKR-', LPAD(t.id_parkir, 6, '0')) AS kode_tiket,
       t.waktu_masuk,
       t.id_kendaraan,
       k.plat_nomor,
       k.jenis_kendaraan,
       k.warna,
       k.pemilik,
       a.id_area,
       a.nama_area,
       tr.tarif_per_jam
     FROM tb_transaksi t
     INNER JOIN tb_kendaraan k ON k.id_kendaraan = t.id_kendaraan
     INNER JOIN tb_area_parkir a ON a.id_area = t.id_area
     INNER JOIN tb_tarif tr ON tr.id_tarif = t.id_tarif
     WHERE t.status = 'masuk'
     ORDER BY t.waktu_masuk ASC`,
  );

  return sendSuccess(res, rows, 'Kendaraan aktif berhasil diambil');
});

/**
 * POST /api/transaksi/masuk
 * Input: id_kendaraan, id_area (opsional; jika kosong area dipilih otomatis)
 * Proses transaksi DB: cek duplikasi aktif, kapasitas, tarif, insert, update area, log.
 */
export const createEntry = asyncHandler(async (req, res) => {
  requireFields(req.body, ['id_kendaraan']);
  const idKendaraan = positiveInt(req.body.id_kendaraan, 'Kendaraan');
  const idArea = req.body.id_area === undefined
    || req.body.id_area === null
    || String(req.body.id_area).trim() === ''
    ? null
    : positiveInt(req.body.id_area, 'Area parkir');

  const receipt = await createEntryRecord({
    idKendaraan,
    idArea,
    userId: req.user.id_user,
  });

  return sendCreated(res, receipt, 'Kendaraan berhasil masuk');
});

/**
 * POST /api/transaksi/scan
 * Input: kode (hasil scan barcode)
 * - Barcode kendaraan (plat nomor) -> transaksi masuk otomatis.
 * - Barcode tiket (PKR-000001)     -> transaksi keluar otomatis.
 */
export const scanBarcode = asyncHandler(async (req, res) => {
  requireFields(req.body, ['kode']);
  const rawCode = text(req.body.kode);
  if (rawCode.length < 2 || rawCode.length > 80) {
    throw new AppError(400, 'Kode barcode tidak valid', 'INVALID_BARCODE');
  }

  const ticketId = parseTicketCode(rawCode);
  if (ticketId) {
    const ticket = await getReceipt(ticketId);
    if (!ticket) {
      throw new AppError(
        404,
        `Barcode tiket "${rawCode}" tidak ditemukan. Periksa kembali kode pada struk (contoh: PKR-000001).`,
        'BARCODE_NOT_FOUND',
      );
    }
    if (ticket.status !== 'masuk') {
      throw new AppError(
        400,
        `Tiket ${ticket.kode_tiket} sudah digunakan / kendaraan sudah keluar`,
        'TICKET_ALREADY_USED',
      );
    }

    const receipt = await processExitRecord(ticketId, req.user.id_user);
    return sendSuccess(res, {
      mode: 'keluar',
      kode: rawCode,
      transaksi: receipt,
    }, `Kendaraan ${receipt.plat_nomor} berhasil keluar`);
  }

  const plateKey = normalizeBarcode(rawCode);
  const [vehicleRows] = await pool.execute(
    `SELECT id_kendaraan, plat_nomor
     FROM tb_kendaraan
     WHERE UPPER(REPLACE(plat_nomor, ' ', '')) = ?
     LIMIT 1`,
    [plateKey],
  );

  if (vehicleRows.length === 0) {
    throw new AppError(
      404,
      `Barcode "${rawCode}" tidak dikenali. Gunakan plat nomor kendaraan yang terdaftar (contoh: B 1234 XYZ) atau barcode tiket berawalan PKR- (contoh: PKR-000001).`,
      'BARCODE_NOT_FOUND',
    );
  }

  const receipt = await createEntryRecord({
    idKendaraan: vehicleRows[0].id_kendaraan,
    idArea: null,
    userId: req.user.id_user,
  });

  return sendSuccess(res, {
    mode: 'masuk',
    kode: rawCode,
    transaksi: receipt,
  }, `Kendaraan ${receipt.plat_nomor} berhasil masuk di ${receipt.nama_area}`);
});

/**
 * POST /api/transaksi/keluar/:id
 * Memanggil stored procedure sp_parkir_keluar lalu mengembalikan struk.
 */
export const createExit = asyncHandler(async (req, res) => {
  const id = routeId(req.params.id, 'ID parkir');
  const receipt = await processExitRecord(id, req.user.id_user);
  return sendSuccess(res, receipt, 'Kendaraan berhasil keluar');
});

/** GET /api/transaksi/:id/struk - detail struk parkir. */
export const getReceiptDetail = asyncHandler(async (req, res) => {
  const id = routeId(req.params.id, 'ID parkir');
  const receipt = await getReceipt(id);
  if (!receipt) {
    throw new AppError(404, 'Struk transaksi tidak ditemukan', 'NOT_FOUND');
  }
  return sendSuccess(res, receipt, 'Struk berhasil diambil');
});

/** POST /api/transaksi/:id/cetak - catat aksi cetak ke log aktivitas. */
export const logReceiptPrint = asyncHandler(async (req, res) => {
  const id = routeId(req.params.id, 'ID parkir');
  const receipt = await getReceipt(id);
  if (!receipt) {
    throw new AppError(404, 'Struk transaksi tidak ditemukan', 'NOT_FOUND');
  }

  await recordActivity(req.user.id_user, `Mencetak struk parkir #${id}`);
  return sendSuccess(res, { id_parkir: id }, 'Aktivitas cetak struk dicatat');
});
