import express from 'express';
import { createReceipt, getReceipt, getAllReceipts } from '../controllers/receiptController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// --- THE FIX ---
// We now point directly to the Controller which has the Blockchain Logic
router.post('/', protect, createReceipt);

// We also add these so your Dashboard History works
router.get('/', protect, getAllReceipts);
router.get('/:id', protect, getReceipt);

export default router;