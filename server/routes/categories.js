import express from 'express';
import { auth, officerAuth } from '../middleware/auth.js';
import Category from '../models/Category.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/categories');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 */
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ active: true })
            .populate('parentCategory')
            .sort('displayOrder');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create new category (officer only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', [auth, officerAuth, upload.single('image')], async (req, res) => {
    try {
        const { name, description, parentCategory, attributes, displayOrder } = req.body;

        const category = new Category({
            name,
            description,
            parentCategory: parentCategory || null,
            attributes: JSON.parse(attributes || '[]'),
            displayOrder: displayOrder || 0
        });

        if (req.file) {
            category.image = `/uploads/categories/${req.file.filename}`;
        }

        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update category (officer only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', [auth, officerAuth, upload.single('image')], async (req, res) => {
    try {
        const { name, description, parentCategory, attributes, displayOrder, active } = req.body;

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        category.name = name || category.name;
        category.description = description || category.description;
        category.parentCategory = parentCategory || category.parentCategory;
        if (attributes) {
            category.attributes = JSON.parse(attributes);
        }
        if (displayOrder !== undefined) {
            category.displayOrder = displayOrder;
        }
        if (active !== undefined) {
            category.active = active;
        }

        if (req.file) {
            category.image = `/uploads/categories/${req.file.filename}`;
        }

        await category.save();
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/categories/{id}/subcategories:
 *   get:
 *     summary: Get subcategories of a category
 *     tags: [Categories]
 */
router.get('/:id/subcategories', async (req, res) => {
    try {
        const subcategories = await Category.find({ 
            parentCategory: req.params.id,
            active: true 
        }).sort('displayOrder');
        res.json(subcategories);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/categories/tree:
 *   get:
 *     summary: Get category tree structure
 *     tags: [Categories]
 */
router.get('/tree', async (req, res) => {
    try {
        const categories = await Category.find({ active: true })
            .populate('subcategories')
            .sort('displayOrder');

        // Only return root categories (those without parent)
        const rootCategories = categories.filter(cat => !cat.parentCategory);

        res.json(rootCategories);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/categories/attributes:
 *   get:
 *     summary: Get all unique category attributes
 *     tags: [Categories]
 */
router.get('/attributes', async (req, res) => {
    try {
        const categories = await Category.find({ active: true });
        const attributes = new Set();

        categories.forEach(category => {
            category.attributes.forEach(attr => {
                attributes.add(attr.name);
            });
        });

        res.json(Array.from(attributes));
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;