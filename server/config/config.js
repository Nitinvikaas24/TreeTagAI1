import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
    // Server Configuration
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    apiUrl: process.env.API_URL || 'http://localhost:3001',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

    // Directory Paths
    dirs: {
        root: __dirname,
        uploads: path.join(__dirname, '..', 'uploads'),
        plants: path.join(__dirname, '..', 'uploads', 'plants'),
        receipts: path.join(__dirname, '..', 'uploads', 'receipts'),
        data: path.join(__dirname, '..', 'data')
    },

    // File Upload Settings
    upload: {
        maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10), // 10MB
        allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
        allowedDocumentTypes: (process.env.ALLOWED_DOCUMENT_TYPES || 'application/pdf,application/msword').split(',')
    },

    // Security
    jwt: {
        secret: process.env.JWT_SECRET || 'treetagai-dev-secret-key',
        expiresIn: process.env.JWT_EXPIRE || '7d'
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
    },

    // External Services
    plantnet: {
        apiKey: process.env.PLANTNET_API_KEY
    },

    // Plant.id API Configuration (Primary Service)
    plantId: {
        apiKey: process.env.PLANT_ID_API_KEY,
        baseUrl: 'https://api.plant.id/v3',
        timeout: 30000,
        maxImageSize: 10 * 1024 * 1024 // 10MB
    },

    // Cors Options
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? process.env.CLIENT_URL 
            : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        optionsSuccessStatus: 200
    }
};