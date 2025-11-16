import express from 'express';
import { searchNurseries } from '../services/searchService.js';

const router = express.Router();

router.get('/nurseries', async (req, res) => {
  try {
    const { plantName } = req.query;
    const results = await searchNurseries(plantName);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch nursery search results', error: error.message });
  }
});

export default router;
