import multer from 'multer';
import sharp from 'sharp';
import { PLANTNET_CONFIG } from '../config/plantnet.js';

// Configure multer for image uploads
const storage = multer.memoryStorage(); // Store in memory for processing

// File filter for image uploads
const fileFilter = (req, file, cb) => {
    if (PLANTNET_CONFIG.SUPPORTED_FORMATS.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file format. Please upload JPEG or PNG images.'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: PLANTNET_CONFIG.MAX_IMAGE_SIZE
    }
});

// Middleware to process and optimize images
export const processImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }

        // Process image with Sharp
        const processedImage = await sharp(req.file.buffer)
            .resize(800, 800, { // Resize to reasonable dimensions
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 }) // Convert to JPEG with good quality
            .toBuffer();

        // Replace original buffer with processed one
        req.file.buffer = processedImage;
        next();
    } catch (error) {
        next(error);
    }
};