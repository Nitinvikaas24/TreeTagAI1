import express from 'express';
import { 
    uploadCropForSale, 
    getOfficerInventory, 
    updateCropListing, 
    deleteCropListing, 
    getOfficerTransactions 
} from '../controllers/officerController.js';
import { protect, officerCheck } from '../middleware/auth.js';
import { upload } from '../config/upload.js'; // Ensure this points to your multer config

const router = express.Router();

// Apply protection to all officer routes
router.use(protect);
router.use(officerCheck);

// Inventory Management
router.post('/upload', upload.single('image'), uploadCropForSale);
router.get('/inventory', getOfficerInventory);
router.put('/inventory/:id', updateCropListing);
router.delete('/inventory/:id', deleteCropListing);

// Transactions
router.get('/transactions', getOfficerTransactions);

export default router;