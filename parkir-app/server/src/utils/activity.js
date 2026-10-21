import { pool } from '../config/db.js';

/**
 * Mencatat aktivitas penting ke tb_log_aktivitas.
 * connection dapat diisi saat proses berada dalam transaksi database.
 */
export async function recordActivity(idUser, activity, connection = pool) {
  const safeActivity = String(activity).slice(0, 100);
  await connection.execute(
    'INSERT INTO tb_log_aktivitas (id_user, aktivitas) VALUES (?, ?)',
    [idUser, safeActivity],
  );
}
