import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  identifyAndFindCrops,
  confirmCropSelection,
  getFarmerTransactions,
  downloadReceipt,
  searchCrops
} from '../controllers/farmerController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for plant image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/farmer-uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'farmer-plant-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// All routes require authentication and farmer role
router.use(authenticate);
router.use(authorize(['farmer', 'user'])); // Allow both farmer and user roles

/**
 * @swagger
 * /api/farmer/identify-and-find:
 *   post:
 *     summary: Identify plant and find matching crops (Farmer Mode)
 *     description: Farmer uploads plant image, system identifies it using existing AI, then finds matching crops from officers using fuzzy matching
 *     tags: [Farmer - Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Plant image file
 *               latitude:
 *                 type: number
 *                 description: GPS latitude for location-based identification
 *               longitude:
 *                 type: number
 *                 description: GPS longitude for location-based identification
 *     responses:
 *       200:
 *         description: Plant identified and matching crops found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     identification:
 *                       type: object
 *                       properties:
 *                         plantName:
 *                           type: string
 *                         confidence:
 *                           type: number
 *                         service:
 *                           type: string
 *                     matches:
 *                       type: object
 *                       properties:
 *                         exact:
 *                           type: array
 *                         strong:
 *                           type: array
 *                         good:
 *                           type: array
 *                         weak:
 *                           type: array
 *                     recommendations:
 *                       type: array
 *       400:
 *         description: Plant identification failed or no image provided
 *       401:
 *         description: Unauthorized
 */
router.post('/identify-and-find', upload.single('image'), identifyAndFindCrops);

/**
 * @swagger
 * /api/farmer/confirm-selection:
 *   post:
 *     summary: Confirm crop selection and create transaction
 *     description: Farmer confirms a crop selection from the fuzzy matching results and initiates purchase
 *     tags: [Farmer - Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cropId
 *             properties:
 *               cropId:
 *                 type: string
 *                 description: Selected crop listing ID
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity to purchase
 *               identificationData:
 *                 type: object
 *                 description: Original plant identification data
 *               matchType:
 *                 type: string
 *                 enum: [exact, strong, good, weak]
 *                 description: Type of match
 *               fuzzyScore:
 *                 type: number
 *                 description: Fuzzy matching similarity score
 *     responses:
 *       200:
 *         description: Crop selection confirmed and transaction created
 *       400:
 *         description: Invalid crop selection or insufficient quantity
 *       404:
 *         description: Crop not found
 */
router.post('/confirm-selection', confirmCropSelection);

/**
 * @swagger
 * /api/farmer/transactions:
 *   get:
 *     summary: Get farmer's transaction history
 *     tags: [Farmer - Marketplace]
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
 *         description: Filter by transaction status
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 */
router.get('/transactions', getFarmerTransactions);

/**
 * @swagger
 * /api/farmer/receipt/{transactionId}:
 *   get:
 *     summary: Download transaction receipt
 *     tags: [Farmer - Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Receipt downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Transaction or receipt not found
 */
router.get('/receipt/:transactionId', downloadReceipt);

/**
 * @swagger
 * /api/farmer/search:
 *   get:
 *     summary: Search available crops
 *     description: Search crops by name, price range, location, etc.
 *     tags: [Farmer - Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for plant names
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location in format "longitude,latitude"
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: integer
 *         description: Maximum distance in meters (default 10000)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
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
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/search', searchCrops);

export default router;
