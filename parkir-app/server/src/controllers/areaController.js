import { pool } from '../config/db.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { recordActivity } from '../utils/activity.js';
import { buildMeta, getPagination, getSorting } from '../utils/pagination.js';
import { sendCreated, sendSuccess } from '../utils/response.js';
import {
  positiveInt,
  requireFields,
  routeId,
  text,
} from '../utils/validation.js';

const SORT_MAP = {
  nama_area: 'nama_area',
  kapasitas: 'kapasitas',
  terisi: 'terisi',
  id_area: 'id_area',
};

function parseOccupied(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

/** GET /api/area - daftar area parkir (admin). */
export const listArea = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req, 10, 100);
  const { sort, order } = getSorting(req, SORT_MAP, 'id_area');
  const search = text(req.query.search);
  const like = `%${search}%`;
  const where = search ? 'WHERE nama_area LIKE ?' : '';
  const params = search ? [like] : [];

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM tb_area_parkir ${where}`,
    params,
  );
  const [rows] = await pool.execute(
    `SELECT id_area, nama_area, kapasitas, terisi
     FROM tb_area_parkir ${where}
     ORDER BY ${sort} ${order}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return sendSuccess(
    res,
    rows,
    'Daftar area berhasil diambil',
    200,
    buildMeta(Number(countRows[0].total), page, limit),
  );
});

/** POST /api/area - tambah area parkir. */
export const createArea = asyncHandler(async (req, res) => {
  requireFields(req.body, ['nama_area', 'kapasitas']);
  const nama = text(req.body.nama_area);
  const kapasitas = positiveInt(req.body.kapasitas, 'Kapasitas', { min: 1, max: 99999 });
  const terisi = parseOccupied(req.body.terisi, 0);

  if (nama.length > 50) {
    throw new AppError(400, 'Nama area maksimal 50 karakter', 'VALIDATION_ERROR');
  }
  if (terisi > kapasitas) {
    throw new AppError(400, 'Jumlah terisi tidak boleh melebihi kapasitas', 'VALIDATION_ERROR');
  }

  const [result] = await pool.execute(
    'INSERT INTO tb_area_parkir (nama_area, kapasitas, terisi) VALUES (?, ?, ?)',
    [nama, kapasitas, terisi],
  );
  await recordActivity(req.user.id_user, `Menambahkan area ${nama}`);

  return sendCreated(res, {
    id_area: result.insertId,
    nama_area: nama,
    kapasitas,
    terisi,
  }, 'Area parkir berhasil ditambahkan');
});

/** PUT /api/area/:id - ubah area & kapasitas. */
export const updateArea = asyncHandler(async (req, res) => {
  const id = routeId(req.params.id, 'ID area');
  requireFields(req.body, ['nama_area', 'kapasitas']);

  const [existingRows] = await pool.execute(
    'SELECT id_area, nama_area, kapasitas, terisi FROM tb_area_parkir WHERE id_area = ? LIMIT 1',
    [id],
  );
  const existing = existingRows[0];
  if (!existing) {
    throw new AppError(404, 'Area parkir tidak ditemukan', 'NOT_FOUND');
  }

  const nama = text(req.body.nama_area);
  const kapasitas = positiveInt(req.body.kapasitas, 'Kapasitas', { min: 1, max: 99999 });
  const terisi = parseOccupied(req.body.terisi, Number(existing.terisi));

  if (nama.length > 50) {
    throw new AppError(400, 'Nama area maksimal 50 karakter', 'VALIDATION_ERROR');
  }
  if (kapasitas < Number(existing.terisi)) {
    throw new AppError(400, `Kapasitas tidak boleh lebih kecil dari jumlah terisi (${existing.terisi})`, 'VALIDATION_ERROR');
  }
  if (terisi > kapasitas) {
    throw new AppError(400, 'Jumlah terisi tidak boleh melebihi kapasitas', 'VALIDATION_ERROR');
  }

  await pool.execute(
    'UPDATE tb_area_parkir SET nama_area = ?, kapasitas = ?, terisi = ? WHERE id_area = ?',
    [nama, kapasitas, terisi, id],
  );
  await recordActivity(req.user.id_user, `Mengubah area ${nama}`);

  return sendSuccess(res, {
    id_area: id,
    nama_area: nama,
    kapasitas,
    terisi,
  }, 'Area parkir berhasil diperbarui');
});

/** DELETE /api/area/:id - tolak jika area masih dipakai transaksi. */
export const deleteArea = asyncHandler(async (req, res) => {
  const id = routeId(req.params.id, 'ID area');
  const [rows] = await pool.execute(
    'SELECT id_area, nama_area FROM tb_area_parkir WHERE id_area = ? LIMIT 1',
    [id],
  );
  if (rows.length === 0) {
    throw new AppError(404, 'Area parkir tidak ditemukan', 'NOT_FOUND');
  }

  await pool.execute('DELETE FROM tb_area_parkir WHERE id_area = ?', [id]);
  await recordActivity(req.user.id_user, `Menghapus area ${rows[0].nama_area}`);

  return sendSuccess(res, null, 'Area parkir berhasil dihapus');
});
