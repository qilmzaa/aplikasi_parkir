import { Router } from 'express';
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from '../controllers/userController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('admin'));
router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
