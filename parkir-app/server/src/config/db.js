import mysql from 'mysql2/promise';
import { env } from './env.js';

/**
 * Connection pool MySQL.
 * dateStrings dipakai agar DATETIME tidak bergeser zona waktu saat dikirim JSON.
 */
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  charset: 'utf8mb4',
});

/** Memastikan database dapat dihubungi saat server mulai. */
export async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1 AS ok');
  } finally {
    connection.release();
  }
}
