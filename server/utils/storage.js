import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { config } from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Set secure permissions on data directory
fs.chmodSync(dataDir, 0o700);

export class DataError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'DataError';
        this.statusCode = statusCode;
    }
}

const validateFileName = (fileName) => {
    // Prevent directory traversal and ensure safe file names
    const safe = /^[a-zA-Z0-9_-]+$/.test(fileName);
    if (!safe) {
        throw new DataError('Invalid collection name', 400);
    }
    return fileName;
};

const getFilePath = (fileName) => {
    const sanitizedName = validateFileName(fileName);
    return path.join(dataDir, `${sanitizedName}.json`);
};

// Add file locking mechanism
const locks = new Map();

const acquireLock = (filePath) => {
    if (locks.has(filePath)) {
        throw new DataError('Resource is locked, try again later', 409);
    }
    locks.set(filePath, Date.now());
};

const releaseLock = (filePath) => {
    locks.delete(filePath);
};

// Generic function to read data from a JSON file with validation
export const readData = (fileName) => {
    const filePath = getFilePath(fileName);
    
    try {
        acquireLock(filePath);
        
        if (!fs.existsSync(filePath)) {
            const emptyData = [];
            writeData(fileName, emptyData);
            return emptyData;
        }

        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);

        // Validate data structure
        if (!Array.isArray(parsed)) {
            throw new DataError('Invalid data structure', 500);
        }

        return parsed;
    } catch (error) {
        if (error instanceof DataError) throw error;
        console.error(`Error reading ${fileName}:`, error);
        throw new DataError(`Failed to read data from ${fileName}`);
    } finally {
        releaseLock(filePath);
    }
};

// Generic function to write data to a JSON file with validation and atomic writes
export const writeData = (fileName, data) => {
    const filePath = getFilePath(fileName);
    const tempPath = `${filePath}.tmp`;
    
    try {
        acquireLock(filePath);
        
        // Validate data
        if (!Array.isArray(data)) {
            throw new DataError('Invalid data format: must be an array', 400);
        }

        // Create backup of existing file
        if (fs.existsSync(filePath)) {
            fs.copyFileSync(filePath, `${filePath}.bak`);
        }

        // Write to temporary file first
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
        
        // Atomic rename
        fs.renameSync(tempPath, filePath);
        
        // Set secure permissions
        fs.chmodSync(filePath, 0o600);
        
        return true;
    } catch (error) {
        // Cleanup temp file if it exists
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
        
        // Restore from backup if available
        if (fs.existsSync(`${filePath}.bak`)) {
            fs.copyFileSync(`${filePath}.bak`, filePath);
        }
        
        console.error(`Error writing ${fileName}:`, error);
        throw new DataError(error.message || 'Failed to write data', error.statusCode || 500);
    } finally {
        // Cleanup backup
        if (fs.existsSync(`${filePath}.bak`)) {
            fs.unlinkSync(`${filePath}.bak`);
        }
        releaseLock(filePath);
    }
};

// Function to generate a cryptographically secure ID
export const generateId = () => {
    return crypto.randomBytes(16).toString('hex');
};

// Function to find an item by ID
export const findById = (fileName, id) => {
    const items = readData(fileName);
    return items.find(item => item.id === id);
};

// Function to find one item by a query
export const findOne = (fileName, query) => {
    const items = readData(fileName);
    return items.find(item => {
        return Object.keys(query).every(key => item[key] === query[key]);
    });
};

// Function to find many items by a query
export const findMany = (fileName, query = {}) => {
    const items = readData(fileName);
    if (Object.keys(query).length === 0) {
        return items;
    }
    return items.filter(item => {
        return Object.keys(query).every(key => item[key] === query[key]);
    });
};

// Function to create a new item
export const create = (fileName, data) => {
    const items = readData(fileName);
    const newItem = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    writeData(fileName, items);
    return newItem;
};

// Function to update an item
export const update = (fileName, id, data) => {
    const items = readData(fileName);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    const updatedItem = { 
        ...items[index], 
        ...data, 
        id, // Preserve the original ID
        updatedAt: new Date().toISOString() 
    };
    items[index] = updatedItem;
    writeData(fileName, items);
    return updatedItem;
};

// Function to delete an item
export const remove = (fileName, id) => {
    const items = readData(fileName);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    items.splice(index, 1);
    return writeData(fileName, items);
};