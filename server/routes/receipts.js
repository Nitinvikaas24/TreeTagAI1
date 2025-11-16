import express from 'express';
import { createReceipt } from '../services/receiptService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST / - create a receipt from cart data (mock)
router.post('/', protect, async (req, res) => {
  try {
    const cartData = req.body;
    const result = await createReceipt(cartData);
    return res.status(201).json(result);
  } catch (err) {
    console.error('Create receipt error:', err);
    return res.status(500).json({ error: 'Failed to create receipt' });
  }
});

export default router;