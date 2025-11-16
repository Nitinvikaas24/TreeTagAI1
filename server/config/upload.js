import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/config.js';

// Generate a secure random filename
const generateSecureFilename = (originalname) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(originalname);
    return `${timestamp}-${randomString}${extension}`;
};

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determine the appropriate upload directory based on file type
        let uploadDir = config.dirs.uploads;
        
        if (file.mimetype.startsWith('image/')) {
            uploadDir = config.dirs.plants;
        } else if (file.mimetype === 'application/pdf') {
            uploadDir = config.dirs.receipts;
        }
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, generateSecureFilename(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = config.upload.allowedImageTypes;
    const allowedDocumentTypes = config.upload.allowedDocumentTypes;
    const allowedTypes = [...allowedImageTypes, ...allowedDocumentTypes];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
};

// Create multer instance with configuration
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.upload.maxSize, // Max file size in bytes
        files: 5 // Maximum number of files per request
    }
});