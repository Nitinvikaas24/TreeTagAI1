import express from 'express';
import multer from 'multer';
// Import the controller we just updated
import { identifyPlant } from '../controllers/identificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// POST / - accepts a single image file
// We add 'protect' middleware optionally if you want to enforce login for history saving
// But the controller handles missing user gracefully.
// For now, let's keep it open but pass user info if token exists (handled by middleware if present in app.js)
// If you want to force login: router.post('/', protect, upload.single('image'), identifyPlant);
router.post('/', protect, upload.single('image'), identifyPlant);

export default router;