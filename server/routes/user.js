import express from 'express';
import { protect } from '../middleware/auth.js'; 
import { getRecentReceipts } from '../controllers/receiptController.js';

const router = express.Router();

// This fetches the REAL Blockchain Invoices
router.get('/purchases/recent', protect, getRecentReceipts);

router.get('/wishlist', protect, (req, res) => res.json({ success: true, data: [] }));
router.get('/suggestions', protect, (req, res) => res.json({ success: true, data: [] }));

export default router;