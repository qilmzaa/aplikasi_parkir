/**
 * Seed akun demo.
 * Jalankan dari folder server: npm run seed
 * Script membuat hash bcrypt baru dan melakukan upsert 3 akun demo.
 */
import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db.js';
import { env } from '../src/config/env.js';

const accounts = [
  {
    nama_lengkap: 'Administrator Parkir',
    username: 'admin1',
    password: 'admin123',
    role: 'admin',
  },
  {
    nama_lengkap: 'Petugas Parkir Satu',
    username: 'petugas1',
    password: 'petugas123',
    role: 'petugas',
  },
  {
    nama_lengkap: 'Pemilik Usaha Parkir',
    username: 'owner1',
    password: 'owner123',
    role: 'owner',
  },
];

async function seed() {
  console.log(`Menghubungkan ke database ${env.db.database}...`);

  for (const account of accounts) {
    const hash = await bcrypt.hash(account.password, 10);
    await pool.execute(
      `INSERT INTO tb_user (nama_lengkap, username, password, role, status_aktif)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         nama_lengkap = VALUES(nama_lengkap),
         password = VALUES(password),
         role = VALUES(role),
         status_aktif = 1`,
      [account.nama_lengkap, account.username, hash, account.role],
    );
    console.log(`✓ ${account.username} (${account.role}) siap digunakan`);
  }

  console.log('\nSeed selesai. Akun demo:');
  console.log('  admin1   / admin123');
  console.log('  petugas1 / petugas123');
  console.log('  owner1   / owner123');
}

seed()
  .catch((error) => {
    console.error('Seed gagal:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
