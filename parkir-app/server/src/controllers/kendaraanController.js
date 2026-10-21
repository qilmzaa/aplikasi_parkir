import { pool } from '../config/db.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { recordActivity } from '../utils/activity.js';
import { buildMeta, getPagination, getSorting } from '../utils/pagination.js';
import { sendCreated, sendSuccess } from '../utils/response.js';
import {
  enumValue,
  positiveInt,
  requireFields,
  routeId,
  text,
} from '../utils/validation.js';

const JENIS_OPTIONS = ['motor', 'mobil', 'lainnya'];
const SORT_MAP = {
  plat_nomor: 'k.plat_nomor',
  jenis_kendaraan: 'k.jenis_kendaraan',
  pemilik: 'k.pemilik',
  warna: 'k.warna',
  id_kendaraan: 'k.id_kendaraan',
};

function normalizePlate(value) {
  return text(value).toUpperCase().replace(/\s+/g, ' ');
}

async function assertUserExists(idUser) {
  const [rows] = await pool.execute(
    'SELECT id_user FROM tb_user WHERE id_user = ? LIMIT 1',
    [idUser],
  );
  if (rows.length === 0) {
    throw new AppError(400, 'Pemilik/User yang dipilih tidak ditemukan', 'INVALID_REFERENCE');
  }
}

/** GET /api/kendaraan - daftar kendaraan + nama pendaftar. */
export const listKendaraan = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req);
  const { sort, order } = getSorting(req, SORT_MAP, 'id_kendaraan');
  const search = text(req.query.search);
  const like = `%${search}%`;
  const filters = [];
  const params = [];

  if (search) {
    filters.push('(k.plat_nomor LIKE ? OR k.pemilik LIKE ? OR k.jenis_kendaraan LIKE ?)');
    params.push(like, like, like);
  }
  if (text(req.query.jenis_kendaraan)) {
    filters.push('k.jenis_kendaraan = ?');
    params.push(text(req.query.jenis_kendaraan));
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM tb_kendaraan k ${where}`,
    params,
  );
  const [rows] = await pool.execute(
    `SELECT k.id_kendaraan, k.plat_nomor, k.jenis_kendaraan, k.warna,
            k.pemilik, k.id_user, u.nama_lengkap AS nama_pendaftar
     FROM tb_kendaraan k
     INNER JOIN tb_user u ON u.id_user = k.id_user
     ${where}
     ORDER BY ${sort} ${order}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return sendSuccess(
    res,
    rows,
    'Daftar kendaraan berhasil diambil',
    200,
    buildMeta(Number(countRows[0].total), page, limit),
  );
});

/** POST /api/kendaraan - tambah kendaraan. */
export const createKendaraan = asyncHandler(async (req, res) => {
  requireFields(req.body, ['plat_nomor', 'jenis_kendaraan', 'warna', 'pemilik', 'id_user']);
  const plat = normalizePlate(req.body.plat_nomor);
  const jenis = enumValue(text(req.body.jenis_kendaraan).toLowerCase(), JENIS_OPTIONS, 'Jenis kendaraan');
  const warna = text(req.body.warna);
  const pemilik = text(req.body.pemilik);
  const idUser = positiveInt(req.body.id_user, 'ID user');

  if (plat.length < 3 || plat.length > 15) {
    throw new AppError(400, 'Plat nomor harus 3-15 karakter', 'VALIDATION_ERROR');
  }
  if (warna.length === 0 || warna.length > 20) {
    throw new AppError(400, 'Warna maksimal 20 karakter', 'VALIDATION_ERROR');
  }
  if (pemilik.length === 0 || pemilik.length > 100) {
    throw new AppError(400, 'Nama pemilik maksimal 100 karakter', 'VALIDATION_ERROR');
  }

  await assertUserExists(idUser);

  const [result] = await pool.execute(
    `INSERT INTO tb_kendaraan (plat_nomor, jenis_kendaraan, warna, pemilik, id_user)
     VALUES (?, ?, ?, ?, ?)`,
    [plat, jenis, warna, pemilik, idUser],
  );
  await recordActivity(req.user.id_user, `Menambahkan kendaraan ${plat}`);

  return sendCreated(res, {
    id_kendaraan: result.insertId,
    plat_nomor: plat,
    jenis_kendaraan: jenis,
    warna,
    pemilik,
    id_user: idUser,
  }, 'Kendaraan berhasil ditambahkan');
});

/** PUT /api/kendaraan/:id - ubah data kendaraan. */
export const updateKendaraan = asyncHandler(async (req, res) => {
  const id = routeId(req.params.id, 'ID kendaraan');
  requireFields(req.body, ['plat_nomor', 'jenis_kendaraan', 'warna', 'pemilik', 'id_user']);

  const [existing] = await pool.execute(
    'SELECT id_kendaraan FROM tb_kendaraan WHERE id_kendaraan = ? LIMIT 1',
    [id],
  );
  if (existing.length === 0) {
    throw new AppError(404, 'Kendaraan tidak ditemukan', 'NOT_FOUND');
  }

  const plat = normalizePlate(req.body.plat_nomor);
  const jenis = enumValue(text(req.body.jenis_kendaraan).toLowerCase(), JENIS_OPTIONS, 'Jenis kendaraan');
  const warna = text(req.body.warna);
  const pemilik = text(req.body.pemilik);
  const idUser = positiveInt(req.body.id_user, 'ID user');

  if (plat.length < 3 || plat.length > 15) {
    throw new AppError(400, 'Plat nomor harus 3-15 karakter', 'VALIDATION_ERROR');
  }
  if (warna.length === 0 || warna.length > 20) {
    throw new AppError(400, 'Warna maksimal 20 karakter', 'VALIDATION_ERROR');
  }
  if (pemilik.length === 0 || pemilik.length > 100) {
    throw new AppError(400, 'Nama pemilik maksimal 100 karakter', 'VALIDATION_ERROR');
  }

  await assertUserExists(idUser);

  await pool.execute(
    `UPDATE tb_kendaraan
     SET plat_nomor = ?, jenis_kendaraan = ?, warna = ?, pemilik = ?, id_user = ?
     WHERE id_kendaraan = ?`,
    [plat, jenis, warna, pemilik, idUser, id],
  );
  await recordActivity(req.user.id_user, `Mengubah kendaraan ${plat}`);

  return sendSuccess(res, {
    id_kendaraan: id,
    plat_nomor: plat,
    jenis_kendaraan: jenis,
    warna,
    pemilik,
    id_user: idUser,
  }, 'Kendaraan berhasil diperbarui');
});

/** DELETE /api/kendaraan/:id - tolak jika masih memiliki transaksi. */
export const deleteKendaraan = asyncHandler(async (req, res) => {
  const id = routeId(req.params.id, 'ID kendaraan');
  const [rows] = await pool.execute(
    'SELECT id_kendaraan, plat_nomor FROM tb_kendaraan WHERE id_kendaraan = ? LIMIT 1',
    [id],
  );
  if (rows.length === 0) {
    throw new AppError(404, 'Kendaraan tidak ditemukan', 'NOT_FOUND');
  }

  await pool.execute('DELETE FROM tb_kendaraan WHERE id_kendaraan = ?', [id]);
  await recordActivity(req.user.id_user, `Menghapus kendaraan ${rows[0].plat_nomor}`);

  return sendSuccess(res, null, 'Kendaraan berhasil dihapus');
});
