import express from 'express';
import { getAdminStats } from '../services/dashboardService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/admin-stats', protect, async (req, res) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load admin stats', error: error.message });
  }
});

export default router;
