import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';
import AppError from '../utils/AppError.js';

/**
 * Memverifikasi Bearer token dan memuat ulang user dari database.
 * Reload user penting agar perubahan role/status_aktif langsung berlaku.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError(401, 'Token autentikasi tidak ditemukan', 'UNAUTHORIZED');
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new AppError(401, 'Sesi telah berakhir, silakan login kembali', 'TOKEN_INVALID');
    }

    const [rows] = await pool.execute(
      'SELECT id_user, nama_lengkap, username, role, status_aktif FROM tb_user WHERE id_user = ? LIMIT 1',
      [payload.sub],
    );

    const user = rows[0];
    if (!user) {
      throw new AppError(401, 'Akun tidak ditemukan', 'UNAUTHORIZED');
    }
    if (Number(user.status_aktif) !== 1) {
      throw new AppError(403, 'Akun Anda sedang dinonaktifkan', 'ACCOUNT_INACTIVE');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
}

/** Middleware pembatas role. */
export function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return next(new AppError(401, 'Silakan login terlebih dahulu', 'UNAUTHORIZED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Anda tidak memiliki akses ke fitur ini', 'FORBIDDEN'));
    }
    return next();
  };
}
