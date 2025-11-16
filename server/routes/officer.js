import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  uploadCropForSale,
  getOfficerInventory,
  updateCropListing,
  deleteCropListing,
  getOfficerTransactions
} from '../controllers/officerController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'image') {
      cb(null, path.join(__dirname, '../uploads/crops'));
    } else if (file.fieldname === 'receipt') {
      cb(null, path.join(__dirname, '../uploads/receipts'));
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image') {
      // Accept images only
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for crop images'));
      }
    } else if (file.fieldname === 'receipt') {
      // Accept Excel and PDF files
      if (file.mimetype.includes('excel') || 
          file.mimetype.includes('spreadsheet') || 
          file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only Excel or PDF files are allowed for receipts'));
      }
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// All routes require authentication and officer role
router.use(authenticate);
router.use(authorize(['officer']));

/**
 * @swagger
 * /api/officer/crops/upload:
 *   post:
 *     summary: Upload crop for sale (Officer Mode)
 *     description: Officer uploads crop image, uses plant identification API, and sets price from receipt or manually
 *     tags: [Officer - Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Crop image file
 *               receipt:
 *                 type: string
 *                 format: binary
 *                 description: Optional Excel/PDF receipt for price extraction
 *               manualPlantName:
 *                 type: string
 *                 description: Manual plant name override (if AI identification fails)
 *               manualScientificName:
 *                 type: string
 *                 description: Manual scientific name
 *               manualPrice:
 *                 type: number
 *                 description: Manual price (if no receipt or extraction fails)
 *               quantity:
 *                 type: integer
 *                 description: Available quantity
 *               category:
 *                 type: string
 *                 description: Crop category
 *               season:
 *                 type: string
 *                 description: Growing season
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       200:
 *         description: Crop uploaded successfully
 *       400:
 *         description: Invalid input or missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post('/crops/upload', 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'receipt', maxCount: 1 }
  ]), 
  uploadCropForSale
);

/**
 * @swagger
 * /api/officer/inventory:
 *   get:
 *     summary: Get officer's crop inventory
 *     tags: [Officer - Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, sold, all]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Inventory retrieved successfully
 */
router.get('/inventory', getOfficerInventory);

/**
 * @swagger
 * /api/officer/crops/{id}:
 *   put:
 *     summary: Update crop listing
 *     tags: [Officer - Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Crop listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [active, inactive, sold]
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Crop updated successfully
 *       404:
 *         description: Crop not found
 */
router.put('/crops/:id', updateCropListing);

/**
 * @swagger
 * /api/officer/crops/{id}:
 *   delete:
 *     summary: Delete crop listing
 *     tags: [Officer - Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Crop listing ID
 *     responses:
 *       200:
 *         description: Crop deleted successfully
 *       404:
 *         description: Crop not found
 */
router.delete('/crops/:id', deleteCropListing);

/**
 * @swagger
 * /api/officer/transactions:
 *   get:
 *     summary: Get officer's transactions
 *     tags: [Officer - Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled, all]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get('/transactions', getOfficerTransactions);

export default router;
