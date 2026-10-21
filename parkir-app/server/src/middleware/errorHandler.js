import AppError from '../utils/AppError.js';
import { env } from '../config/env.js';

/** Endpoint tidak ditemukan. */
export function notFoundHandler(req, res, next) {
  next(new AppError(404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`, 'NOT_FOUND'));
}

/** Error handler terpusat; semua respons error memakai bentuk JSON yang sama. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Terjadi kesalahan pada server';
  let code = error.code || 'INTERNAL_ERROR';

  // Error duplikasi unique key MySQL.
  if (error.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    code = 'DUPLICATE_DATA';
    message = 'Data sudah ada. Periksa kembali username, plat nomor, atau jenis tarif.';
  }

  // Data masih dipakai foreign key.
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 409;
    code = 'DATA_IN_USE';
    message = 'Data tidak dapat dihapus karena masih digunakan oleh data lain.';
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    code = 'INVALID_REFERENCE';
    message = 'Data referensi yang dipilih tidak ditemukan.';
  }

  if (error.code === 'ER_DATA_TOO_LONG') {
    statusCode = 400;
    code = 'INVALID_LENGTH';
    message = 'Panjang data melebihi batas kolom database.';
  }

  if (error.code === 'ER_TRUNCATED_WRONG_VALUE' || error.code === 'WARN_DATA_TRUNCATED') {
    statusCode = 400;
    code = 'INVALID_VALUE';
    message = 'Nilai data tidak sesuai dengan tipe kolom database.';
  }

  // SIGNAL dari stored procedure.
  if (error.sqlState === '45000' || error.errno === 1644) {
    statusCode = 400;
    code = 'PROCEDURE_ERROR';
    message = error.sqlMessage || message;
  }

  // Body JSON tidak valid dari express.json().
  if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Format JSON pada request tidak valid.';
  }

  if (statusCode >= 500) {
    console.error('[ERROR]', error);
  }

  const payload = {
    success: false,
    message,
    code,
  };

  if (error.details) payload.errors = error.details;
  if (env.nodeEnv === 'development' && statusCode >= 500) {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
}
