import { Router } from 'express';
import {
  createArea,
  deleteArea,
  listArea,
  updateArea,
} from '../controllers/areaController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('admin'));
router.get('/', listArea);
router.post('/', createArea);
router.put('/:id', updateArea);
router.delete('/:id', deleteArea);

export default router;
