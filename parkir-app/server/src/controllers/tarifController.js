import { pool } from '../config/db.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { recordActivity } from '../utils/activity.js';
import { buildMeta, getPagination, getSorting } from '../utils/pagination.js';
import { sendCreated, sendSuccess } from '../utils/response.js';
import {
  enumValue,
  nonNegativeNumber,
  requireFields,
  routeId,
  text,
} from '../utils/validation.js';

const JENIS_OPTIONS = ['motor', 'mobil', 'lainnya'];
const SORT_MAP = {
  jenis_kendaraan: 'jenis_kendaraan',
  tarif_per_jam: 'tarif_per_jam',
  id_tarif: 'id_tarif',
};

/** GET /api/tarif - daftar tarif dengan pencarian & paginasi. */
export const listTarif = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req, 10, 100);
  const { sort, order } = getSorting(req, SORT_MAP, 'id_tarif');
  const search = text(req.query.search);
  const like = `%${search}%`;
  const where = search ? 'WHERE jenis_kendaraan LIKE ?' : '';
  const params = search ? [like] : [];

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM tb_tarif ${where}`,
    params,
  );
  const [rows] = await pool.execute(
    `SELECT id_tarif, jenis_kendaraan, tarif_per_jam
     FROM tb_tarif ${where}
     ORDER BY ${sort} ${order}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return sendSuccess(
    res,
    rows,
    'Daftar tarif berhasil diambil',
    200,
    buildMeta(Number(countRows[0].total), page, limit),
  );
});

/** POST /api/tarif - tambah tarif per jenis kendaraan. */
export const createTarif = asyncHandler(async (req, res) => {
  requireFields(req.body, ['jenis_kendaraan', 'tarif_per_jam']);
  const jenis = enumValue(text(req.body.jenis_kendaraan), JENIS_OPTIONS, 'Jenis kendaraan');
  const tarif = nonNegativeNumber(req.body.tarif_per_jam, 'Tarif per jam');

  const [result] = await pool.execute(
    'INSERT INTO tb_tarif (jenis_kendaraan, tarif_per_jam) VALUES (?, ?)',
    [jenis, tarif],
  );
  await recordActivity(req.user.id_user, `Menambahkan tarif ${jenis}`);

  return sendCreated(res, {
    id_tarif: result.insertId,
    jenis_kendaraan: jenis,
    tarif_per_jam: tarif,
  }, 'Tarif berhasil ditambahkan');
});

/** PUT /api/tarif/:id - ubah tarif. */
export const updateTarif = asyncHandler(async (req, res) => {
  const id = routeId(req.params.id, 'ID tarif');
  requireFields(req.body, ['jenis_kendaraan', 'tarif_per_jam']);
  const jenis = enumValue(text(req.body.jenis_kendaraan), JENIS_OPTIONS, 'Jenis kendaraan');
  const tarif = nonNegativeNumber(req.body.tarif_per_jam, 'Tarif per jam');

  const [existing] = await pool.execute(
    'SELECT id_tarif FROM tb_tarif WHERE id_tarif = ? LIMIT 1',
    [id],
  );
  if (existing.length === 0) {
    throw new AppError(404, 'Tarif tidak ditemukan', 'NOT_FOUND');
  }

  await pool.execute(
    'UPDATE tb_tarif SET jenis_kendaraan = ?, tarif_per_jam = ? WHERE id_tarif = ?',
    [jenis, tarif, id],
  );
  await recordActivity(req.user.id_user, `Mengubah tarif ${jenis}`);

  return sendSuccess(res, {
    id_tarif: id,
    jenis_kendaraan: jenis,
    tarif_per_jam: tarif,
  }, 'Tarif berhasil diperbarui');
});

/** DELETE /api/tarif/:id - gagal dengan pesan jelas jika dipakai transaksi. */
export const deleteTarif = asyncHandler(async (req, res) => {
  const id = routeId(req.params.id, 'ID tarif');
  const [rows] = await pool.execute(
    'SELECT id_tarif, jenis_kendaraan FROM tb_tarif WHERE id_tarif = ? LIMIT 1',
    [id],
  );
  if (rows.length === 0) {
    throw new AppError(404, 'Tarif tidak ditemukan', 'NOT_FOUND');
  }

  await pool.execute('DELETE FROM tb_tarif WHERE id_tarif = ?', [id]);
  await recordActivity(req.user.id_user, `Menghapus tarif ${rows[0].jenis_kendaraan}`);

  return sendSuccess(res, null, 'Tarif berhasil dihapus');
});
