import express from 'express';
import { auth } from '../middleware/auth.js';
import Cart from '../models/Cart.js';
import Plant from '../models/Plant.js';

const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', auth, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id })
            .populate('items.plant');

        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }

        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', auth, async (req, res) => {
    try {
        const { plantId, quantity } = req.body;

        // Validate plant exists and has sufficient stock
        const plant = await Plant.findById(plantId);
        if (!plant) {
            return res.status(404).json({ error: 'Plant not found' });
        }

        if (plant.quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }

        // Check if plant already in cart
        const existingItem = cart.items.find(item => 
            item.plant.toString() === plantId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ plant: plantId, quantity });
        }

        await cart.save();
        cart = await cart.populate('items.plant');

        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/cart/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:itemId', auth, async (req, res) => {
    try {
        const { quantity } = req.body;
        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const cartItem = cart.items.id(req.params.itemId);
        if (!cartItem) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        // Validate stock
        const plant = await Plant.findById(cartItem.plant);
        if (plant.quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        cartItem.quantity = quantity;
        await cart.save();
        
        const updatedCart = await cart.populate('items.plant');
        res.json(updatedCart);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/cart/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:itemId', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => 
            item._id.toString() !== req.params.itemId
        );

        await cart.save();
        const updatedCart = await cart.populate('items.plant');
        res.json(updatedCart);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/cart/checkout:
 *   post:
 *     summary: Checkout cart and create order
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.post('/checkout', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id })
            .populate('items.plant');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Validate stock for all items
        for (const item of cart.items) {
            const plant = await Plant.findById(item.plant);
            if (!plant || plant.quantity < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for ${plant ? plant.name : 'item'}`
                });
            }
        }

        // Create order
        const order = await Order.create({
            user: req.user.id,
            items: cart.items,
            total: cart.items.reduce((sum, item) => 
                sum + (item.plant.price * item.quantity), 0
            ),
            status: 'processing'
        });

        // Update plant quantities
        await Promise.all(cart.items.map(async (item) => {
            await Plant.findByIdAndUpdate(item.plant._id, {
                $inc: { quantity: -item.quantity }
            });
        }));

        // Clear cart
        cart.items = [];
        await cart.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;