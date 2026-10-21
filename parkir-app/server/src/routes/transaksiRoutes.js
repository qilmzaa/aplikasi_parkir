import { Router } from 'express';
import {
  createEntry,
  createExit,
  getReceiptDetail,
  getTransactionOptions,
  listActiveTransactions,
  logReceiptPrint,
  scanBarcode,
} from '../controllers/transaksiController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('petugas'));
router.get('/opsi', getTransactionOptions);
router.get('/aktif', listActiveTransactions);
router.post('/scan', scanBarcode);
router.post('/masuk', createEntry);
router.post('/keluar/:id', createExit);
router.get('/:id/struk', getReceiptDetail);
router.post('/:id/cetak', logReceiptPrint);

export default router;
