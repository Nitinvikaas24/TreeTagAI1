import express from 'express';
import { createReceipt, getReceipt, getAllReceipts } from '../controllers/receiptController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Create new receipt (Mint to Blockchain)
router.post('/', protect, createReceipt);

// Get History
router.get('/', protect, getAllReceipts);
router.get('/:id', protect, getReceipt);

export default router;