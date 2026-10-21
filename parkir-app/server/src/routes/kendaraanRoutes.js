import { Router } from 'express';
import {
  createKendaraan,
  deleteKendaraan,
  listKendaraan,
  updateKendaraan,
} from '../controllers/kendaraanController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('admin'));
router.get('/', listKendaraan);
router.post('/', createKendaraan);
router.put('/:id', updateKendaraan);
router.delete('/:id', deleteKendaraan);

export default router;
