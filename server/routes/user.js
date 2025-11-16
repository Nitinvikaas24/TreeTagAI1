import express from 'express';
import { auth } from '../middleware/auth.js';

const router = express.Router();

console.log('User routes module loaded');

// Test route without auth
router.get('/test', (req, res) => {
    console.log('Test route hit');
    res.json({ message: 'User routes are working' });
});

// Mock user data endpoints
router.get('/purchases/recent', auth, (req, res) => {
    try {
        console.log('Recent purchases request from user:', req.user);
        // Mock recent purchases
        res.json({
            success: true,
            data: [
                {
                    _id: 1,
                    plant: {
                        name: 'Rose',
                        image: '/uploads/rose.jpg'
                    },
                    quantity: 2,
                    amount: 25.50,
                    date: new Date().toISOString()
                },
                {
                    _id: 2,
                    plant: {
                        name: 'Tulip',
                        image: '/uploads/tulip.jpg'
                    },
                    quantity: 5,
                    amount: 15.00,
                    date: new Date().toISOString()
                }
            ]
        });
    } catch (error) {
        console.error('Error in /purchases/recent:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/wishlist', auth, (req, res) => {
    // Mock wishlist
    res.json({
        success: true,
        data: [
            {
                _id: 1,
                name: 'Orchid',
                category: 'Flowering Plant',
                price: 45.00,
                image: '/uploads/orchid.jpg'
            },
            {
                _id: 2,
                name: 'Cactus',
                category: 'Succulent',
                price: 12.00,
                image: '/uploads/cactus.jpg'
            }
        ]
    });
});

router.get('/suggestions', auth, (req, res) => {
    // Mock plant suggestions
    res.json({
        success: true,
        data: [
            {
                _id: 1,
                name: 'Sunflower',
                category: 'Flowering Plant',
                price: 8.50,
                image: '/uploads/sunflower.jpg'
            },
            {
                _id: 2,
                name: 'Peace Lily',
                category: 'Air Purifier',
                price: 22.00,
                image: '/uploads/peace-lily.jpg'
            }
        ]
    });
});

export default router;