import express from 'express';
// We use 'protect' from auth.js (ensure this matches your middleware file name)
import { protect } from '../middleware/auth.js'; 
// Import the REAL logic from your receipt controller
import { getRecentReceipts } from '../controllers/receiptController.js';

const router = express.Router();

console.log('User routes module loaded');

// 1. Recent Purchases -> Connects to your REAL Blockchain Receipts
// This allows the dashboard to show the invoices you just minted
router.get('/purchases/recent', protect, getRecentReceipts);

// 2. Wishlist (Placeholder - keeps dashboard happy)
router.get('/wishlist', protect, (req, res) => {
    res.json({ success: true, data: [] });
});

// 3. Suggestions (Placeholder - keeps dashboard happy)
router.get('/suggestions', protect, (req, res) => {
    res.json({ success: true, data: [] });
});

export default router;