import app from './app.js';
import { env } from './config/env.js';
import { pool, testConnection } from './config/db.js';

async function startServer() {
  try {
    await testConnection();
    console.log(`[DB] Terhubung ke database "${env.db.database}" di ${env.db.host}:${env.db.port}`);

    const server = app.listen(env.port, () => {
      console.log(`[API] Aplikasi Parkir berjalan di http://localhost:${env.port}`);
      console.log(`[API] Health check: http://localhost:${env.port}/api/health`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[APP] Menerima ${signal}, menutup server...`);
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[FATAL] Gagal menjalankan server:', error.message);
    process.exit(1);
  }
}

startServer();
