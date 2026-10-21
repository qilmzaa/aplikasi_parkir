import bcrypt from 'bcryptjs';
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

const ROLE_OPTIONS = ['admin', 'petugas', 'owner'];
const SORT_MAP = {
  nama_lengkap: 'nama_lengkap',
  username: 'username',
  role: 'role',
  status_aktif: 'status_aktif',
  id_user: 'id_user',
};

function parseStatus(value, fallback = 1) {
  if (value === undefined || value === null || value === '') return fallback;
  return Number(value) === 1 ? 1 : 0;
}

/** GET /api/users - daftar user dengan pencarian, sorting, paginasi. */
export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req);
  const { sort, order } = getSorting(req, SORT_MAP, 'id_user');
  const search = text(req.query.search);
  const role = text(req.query.role);
  const like = `%${search}%`;

  const filters = [];
  const params = [];

  if (search) {
    filters.push('(nama_lengkap LIKE ? OR username LIKE ?)');
    params.push(like, like);
  }
  if (role && ROLE_OPTIONS.includes(role)) {
    filters.push('role = ?');
    params.push(role);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM tb_user ${where}`,
    params,
  );
  const [rows] = await pool.execute(
    `SELECT id_user, nama_lengkap, username, role, status_aktif
     FROM tb_user ${where}
     ORDER BY ${sort} ${order}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const total = Number(countRows[0].total);
  return sendSuccess(res, rows, 'Daftar user berhasil diambil', 200, buildMeta(total, page, limit));
});

/** POST /api/users - tambah user baru dengan password ter-hash. */
export const createUser = asyncHandler(async (req, res) => {
  requireFields(req.body, ['nama_lengkap', 'username', 'password', 'role']);
  const nama = text(req.body.nama_lengkap);
  const username = text(req.body.username).toLowerCase();
  const password = String(req.body.password);
  const role = enumValue(text(req.body.role), ROLE_OPTIONS, 'Role');
  const statusAktif = parseStatus(req.body.status_aktif, 1);

  if (nama.length < 2 || nama.length > 50) {
    throw new AppError(400, 'Nama lengkap harus 2-50 karakter', 'VALIDATION_ERROR');
  }
  if (!/^[a-z0-9_.-]{3,50}$/.test(username)) {
    throw new AppError(400, 'Username 3-50 karakter dan hanya boleh huruf, angka, titik, garis bawah, atau strip', 'VALIDATION_ERROR');
  }
  if (password.length < 6 || password.length > 100) {
    throw new AppError(400, 'Password harus 6-100 karakter', 'VALIDATION_ERROR');
  }

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    `INSERT INTO tb_user (nama_lengkap, username, password, role, status_aktif)
     VALUES (?, ?, ?, ?, ?)`,
    [nama, username, hash, role, statusAktif],
  );

  await recordActivity(req.user.id_user, `Menambahkan user ${username}`);

  return sendCreated(res, {
    id_user: result.insertId,
    nama_lengkap: nama,
    username,
    role,
    status_aktif: statusAktif,
  }, 'User berhasil ditambahkan');
});

/** PUT /api/users/:id - ubah user; password hanya diubah jika diisi. */
export const updateUser = asyncHandler(async (req, res) => {
  const id = routeId(req.params.id, 'ID user');
  requireFields(req.body, ['nama_lengkap', 'username', 'role']);

  const [existingRows] = await pool.execute(
    'SELECT id_user, username, role, status_aktif FROM tb_user WHERE id_user = ? LIMIT 1',
    [id],
  );
  if (existingRows.length === 0) {
    throw new AppError(404, 'User tidak ditemukan', 'NOT_FOUND');
  }

  const nama = text(req.body.nama_lengkap);
  const username = text(req.body.username).toLowerCase();
  const role = enumValue(text(req.body.role), ROLE_OPTIONS, 'Role');
  const statusAktif = parseStatus(req.body.status_aktif, existingRows[0].status_aktif);

  if (nama.length < 2 || nama.length > 50) {
    throw new AppError(400, 'Nama lengkap harus 2-50 karakter', 'VALIDATION_ERROR');
  }
  if (!/^[a-z0-9_.-]{3,50}$/.test(username)) {
    throw new AppError(400, 'Username tidak valid', 'VALIDATION_ERROR');
  }
  if (id === req.user.id_user && statusAktif === 0) {
    throw new AppError(400, 'Anda tidak dapat menonaktifkan akun sendiri', 'SELF_DEACTIVATE');
  }
  if (id === req.user.id_user && role !== existingRows[0].role) {
    throw new AppError(400, 'Anda tidak dapat mengubah role akun sendiri', 'SELF_ROLE_CHANGE');
  }

  let passwordSql = '';
  const params = [nama, username, role, statusAktif];

  if (req.body.password !== undefined && String(req.body.password) !== '') {
    const password = String(req.body.password);
    if (password.length < 6 || password.length > 100) {
      throw new AppError(400, 'Password harus 6-100 karakter', 'VALIDATION_ERROR');
    }
    passwordSql = ', password = ?';
    params.push(await bcrypt.hash(password, 10));
  }

  params.push(id);
  await pool.execute(
    `UPDATE tb_user
     SET nama_lengkap = ?, username = ?, role = ?, status_aktif = ?${passwordSql}
     WHERE id_user = ?`,
    params,
  );

  await recordActivity(req.user.id_user, `Mengubah user ${username}`);

  return sendSuccess(res, {
    id_user: id,
    nama_lengkap: nama,
    username,
    role,
    status_aktif: statusAktif,
  }, 'User berhasil diperbarui');
});

/** DELETE /api/users/:id - admin tidak boleh menghapus akun sendiri. */
export const deleteUser = asyncHandler(async (req, res) => {
  const id = routeId(req.params.id, 'ID user');

  if (id === req.user.id_user) {
    throw new AppError(400, 'Anda tidak boleh menghapus akun sendiri', 'SELF_DELETE');
  }

  const [rows] = await pool.execute(
    'SELECT id_user, username FROM tb_user WHERE id_user = ? LIMIT 1',
    [id],
  );
  if (rows.length === 0) {
    throw new AppError(404, 'User tidak ditemukan', 'NOT_FOUND');
  }

  await pool.execute('DELETE FROM tb_user WHERE id_user = ?', [id]);
  await recordActivity(req.user.id_user, `Menghapus user ${rows[0].username}`);

  return sendSuccess(res, null, 'User berhasil dihapus');
});
