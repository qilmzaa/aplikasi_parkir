import { Router } from 'express';
import {
  createTarif,
  deleteTarif,
  listTarif,
  updateTarif,
} from '../controllers/tarifController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('admin'));
router.get('/', listTarif);
router.post('/', createTarif);
router.put('/:id', updateTarif);
router.delete('/:id', deleteTarif);

export default router;
