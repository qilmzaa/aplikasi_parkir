import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tarifRoutes from './routes/tarifRoutes.js';
import areaRoutes from './routes/areaRoutes.js';
import kendaraanRoutes from './routes/kendaraanRoutes.js';
import logRoutes from './routes/logRoutes.js';
import transaksiRoutes from './routes/transaksiRoutes.js';
import rekapRoutes from './routes/rekapRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import asyncHandler from './utils/asyncHandler.js';
import { sendSuccess } from './utils/response.js';

const app = express();

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    const isLocalOrigin = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
    const isConfiguredOrigin = origin === env.clientOrigin;
    // Saat development, izinkan localhost dengan port apa pun (Vite bisa pindah port).
    if (!origin || isConfiguredOrigin || (env.nodeEnv !== 'production' && isLocalOrigin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin tidak diizinkan oleh CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/api/health', asyncHandler(async (req, res) => {
  await pool.query('SELECT 1');
  return sendSuccess(res, { status: 'ok', waktu: new Date().toISOString() }, 'Server berjalan');
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tarif', tarifRoutes);
app.use('/api/area', areaRoutes);
app.use('/api/kendaraan', kendaraanRoutes);
app.use('/api/log', logRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/rekap', rekapRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
