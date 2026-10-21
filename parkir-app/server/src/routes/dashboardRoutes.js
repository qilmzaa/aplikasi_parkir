import { Router } from 'express';
import { adminDashboard, petugasDashboard } from '../controllers/dashboardController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/admin', requireRole('admin'), adminDashboard);
router.get('/petugas', requireRole('petugas'), petugasDashboard);

export default router;
