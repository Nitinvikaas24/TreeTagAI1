import express from 'express';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { validateUser } from '../validators/userValidator.js';

const router = express.Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/profile', auth, validateUser, async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.address = address || user.address;

        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/users/purchases:
 *   get:
 *     summary: Get user's purchase history
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/purchases', auth, async (req, res) => {
    try {
        const { period = 'all' } = req.query;
        let dateFilter = {};

        // Apply date filter based on period
        if (period !== 'all') {
            const now = new Date();
            switch (period) {
                case 'month':
                    dateFilter.date = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
                    break;
                case '6months':
                    dateFilter.date = { $gte: new Date(now.setMonth(now.getMonth() - 6)) };
                    break;
                case 'year':
                    dateFilter.date = { $gte: new Date(now.getFullYear(), 0, 1) };
                    break;
            }
        }

        const purchases = await Order.find({
            user: req.user.id,
            ...dateFilter
        })
        .populate('items.plant')
        .sort({ date: -1 });

        res.json(purchases);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/users/suggestions:
 *   get:
 *     summary: Get personalized plant suggestions
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/suggestions', auth, async (req, res) => {
    try {
        // Get user's purchase history
        const userOrders = await Order.find({ user: req.user.id })
            .populate('items.plant');

        // Extract categories from purchased plants
        const purchasedCategories = new Set();
        userOrders.forEach(order => {
            order.items.forEach(item => {
                if (item.plant && item.plant.category) {
                    purchasedCategories.add(item.plant.category.toString());
                }
            });
        });

        // Find similar plants from the same categories
        const suggestions = await Plant.find({
            category: { $in: Array.from(purchasedCategories) },
            _id: {
                $nin: userOrders.flatMap(order => 
                    order.items.map(item => item.plant._id)
                )
            }
        })
        .limit(8)
        .sort('-rating');

        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;