import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { auth, requireRole } from '../middleware/authSimple.js';
import { 
  identifyPlant,
  getIdentificationHistory,
  deleteIdentification 
} from '../controllers/identificationControllerRealAPI.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for plant image uploads
// Use memory storage to provide both file buffer and disk storage
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg, .jpeg and .webp formats are allowed!'));
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for real API calls
  }
});

// Routes
router.post('/identify', auth, upload.single('image'), identifyPlant);
router.get('/history', auth, getIdentificationHistory);
router.delete('/:id', auth, requireRole('officer'), deleteIdentification);

export default router;