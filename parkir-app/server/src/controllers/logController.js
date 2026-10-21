import { pool } from '../config/db.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildMeta, getPagination, getSorting } from '../utils/pagination.js';
import { sendSuccess } from '../utils/response.js';
import { dateOnly, text } from '../utils/validation.js';

const SORT_MAP = {
  waktu_aktivitas: 'l.waktu_aktivitas',
  aktivitas: 'l.aktivitas',
  nama_lengkap: 'u.nama_lengkap',
  id_log: 'l.id_log',
};

/**
 * GET /api/log
 * Filter opsional: dari, sampai, search, sort, order, page, limit.
 * Hanya dapat diakses admin.
 */
export const listLog = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req, 20, 100);
  const { sort, order } = getSorting(req, SORT_MAP, 'waktu_aktivitas');
  const search = text(req.query.search);
  const dari = text(req.query.dari) ? dateOnly(req.query.dari, 'Tanggal awal') : null;
  const sampai = text(req.query.sampai) ? dateOnly(req.query.sampai, 'Tanggal akhir') : null;

  if (dari && sampai && dari > sampai) {
    throw new AppError(400, 'Tanggal awal tidak boleh lebih besar dari tanggal akhir', 'VALIDATION_ERROR');
  }

  const filters = [];
  const params = [];

  if (search) {
    const like = `%${search}%`;
    filters.push('(l.aktivitas LIKE ? OR u.nama_lengkap LIKE ? OR u.username LIKE ?)');
    params.push(like, like, like);
  }
  if (dari) {
    filters.push('DATE(l.waktu_aktivitas) >= ?');
    params.push(dari);
  }
  if (sampai) {
    filters.push('DATE(l.waktu_aktivitas) <= ?');
    params.push(sampai);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM tb_log_aktivitas l
     INNER JOIN tb_user u ON u.id_user = l.id_user
     ${where}`,
    params,
  );

  const [rows] = await pool.execute(
    `SELECT l.id_log, l.id_user, u.nama_lengkap, u.username, u.role,
            l.aktivitas, l.waktu_aktivitas
     FROM tb_log_aktivitas l
     INNER JOIN tb_user u ON u.id_user = l.id_user
     ${where}
     ORDER BY ${sort} ${order}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return sendSuccess(
    res,
    rows,
    'Log aktivitas berhasil diambil',
    200,
    buildMeta(Number(countRows[0].total), page, limit),
  );
});
