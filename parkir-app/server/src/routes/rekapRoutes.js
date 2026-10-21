import { Router } from 'express';
import { exportRekapCsv, getRekap } from '../controllers/rekapController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('owner'));
router.get('/export', exportRekapCsv);
router.get('/', getRekap);

export default router;
