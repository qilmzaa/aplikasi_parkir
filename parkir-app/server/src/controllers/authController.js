import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { recordActivity } from '../utils/activity.js';
import { sendSuccess } from '../utils/response.js';
import { requireFields, text } from '../utils/validation.js';

/**
 * POST /api/auth/login
 * Input: username, password
 * Proses: cek kredensial bcrypt + status aktif, buat JWT, catat log
 * Output: token, data user (tanpa password)
 */
export const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['username', 'password']);
  const username = text(req.body.username);
  const password = String(req.body.password);

  const [rows] = await pool.execute(
    `SELECT id_user, nama_lengkap, username, password, role, status_aktif
     FROM tb_user WHERE username = ? LIMIT 1`,
    [username],
  );

  const user = rows[0];
  if (!user) {
    throw new AppError(401, 'Username atau password salah', 'INVALID_CREDENTIALS');
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    throw new AppError(401, 'Username atau password salah', 'INVALID_CREDENTIALS');
  }

  if (Number(user.status_aktif) !== 1) {
    throw new AppError(403, 'Akun Anda dinonaktifkan. Hubungi administrator.', 'ACCOUNT_INACTIVE');
  }

  const token = jwt.sign(
    { sub: user.id_user, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

  await recordActivity(user.id_user, 'Login ke sistem');

  const safeUser = {
    id_user: user.id_user,
    nama_lengkap: user.nama_lengkap,
    username: user.username,
    role: user.role,
    status_aktif: Number(user.status_aktif),
  };

  return sendSuccess(res, { token, user: safeUser }, 'Login berhasil');
});

/**
 * POST /api/auth/logout
 * Input: user dari token
 * Proses: catat aktivitas logout (JWT bersifat stateless)
 * Output: pesan sukses
 */
export const logout = asyncHandler(async (req, res) => {
  await recordActivity(req.user.id_user, 'Logout dari sistem');
  return sendSuccess(res, null, 'Logout berhasil');
});

/** GET /api/auth/me - mengembalikan user aktif berdasarkan token. */
export const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    id_user: req.user.id_user,
    nama_lengkap: req.user.nama_lengkap,
    username: req.user.username,
    role: req.user.role,
    status_aktif: Number(req.user.status_aktif),
  });
});
