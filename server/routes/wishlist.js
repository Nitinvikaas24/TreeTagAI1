import express from 'express';
import { auth } from '../middleware/auth.js';
import Wishlist from '../models/Wishlist.js';
import Plant from '../models/Plant.js';

const router = express.Router();

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', auth, async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user.id })
            .populate('plants');

        if (!wishlist) {
            wishlist = await Wishlist.create({ user: req.user.id, plants: [] });
        }

        res.json(wishlist.plants);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/wishlist/{plantId}:
 *   post:
 *     summary: Add plant to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:plantId', auth, async (req, res) => {
    try {
        const plant = await Plant.findById(req.params.plantId);
        if (!plant) {
            return res.status(404).json({ error: 'Plant not found' });
        }

        let wishlist = await Wishlist.findOne({ user: req.user.id });
        if (!wishlist) {
            wishlist = await Wishlist.create({ user: req.user.id, plants: [] });
        }

        // Check if plant already in wishlist
        if (wishlist.plants.includes(req.params.plantId)) {
            return res.status(400).json({ error: 'Plant already in wishlist' });
        }

        wishlist.plants.push(req.params.plantId);
        await wishlist.save();

        const updatedWishlist = await wishlist.populate('plants');
        res.json(updatedWishlist.plants);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/wishlist/{plantId}:
 *   delete:
 *     summary: Remove plant from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:plantId', auth, async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id });
        
        if (!wishlist) {
            return res.status(404).json({ error: 'Wishlist not found' });
        }

        wishlist.plants = wishlist.plants.filter(
            plantId => plantId.toString() !== req.params.plantId
        );

        await wishlist.save();
        const updatedWishlist = await wishlist.populate('plants');
        res.json(updatedWishlist.plants);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/wishlist/move-to-cart/{plantId}:
 *   post:
 *     summary: Move plant from wishlist to cart
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 */
router.post('/move-to-cart/:plantId', auth, async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id });
        if (!wishlist) {
            return res.status(404).json({ error: 'Wishlist not found' });
        }

        const plant = await Plant.findById(req.params.plantId);
        if (!plant) {
            return res.status(404).json({ error: 'Plant not found' });
        }

        // Add to cart
        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }

        cart.items.push({ plant: req.params.plantId, quantity: 1 });
        await cart.save();

        // Remove from wishlist
        wishlist.plants = wishlist.plants.filter(
            plantId => plantId.toString() !== req.params.plantId
        );
        await wishlist.save();

        const updatedWishlist = await wishlist.populate('plants');
        res.json({
            wishlist: updatedWishlist.plants,
            message: 'Plant moved to cart successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;