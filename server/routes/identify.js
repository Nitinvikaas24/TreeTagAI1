import express from 'express';
import multer from 'multer';
import { identifyPlant } from '../services/plantNetService.js';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// POST / - accepts a single image file in memory and returns mock identification result
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const result = await identifyPlant(req.file.buffer);
    return res.json(result);
  } catch (err) {
    console.error('Identification route error:', err);
    return res.status(500).json({ error: 'Identification failed' });
  }
});

export default router;
