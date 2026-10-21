import { Router } from 'express';
import { listLog } from '../controllers/logController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('admin'));
router.get('/', listLog);

export default router;
