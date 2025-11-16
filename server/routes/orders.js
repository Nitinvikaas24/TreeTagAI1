import express from 'express';
import { auth, officerAuth } from '../middleware/auth.js';
import Order from '../models/Order.js';
import Plant from '../models/Plant.js';
import Receipt from '../models/Receipt.js';

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders (officer) or user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', auth, async (req, res) => {
    try {
        const query = req.user.role === 'officer' ? {} : { user: req.user.id };
        const orders = await Order.find(query)
            .populate('user', '-password')
            .populate('items.plant')
            .sort('-createdAt');
        
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', '-password')
            .populate('items.plant')
            .populate('receipt');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if user has permission to view this order
        if (req.user.role !== 'officer' && order.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status (officer only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/status', [auth, officerAuth], async (req, res) => {
    try {
        const { status, notes } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        await order.updateStatus(status, notes);
        
        // Send notification to user about status update
        // TODO: Implement notification system

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/orders/statistics:
 *   get:
 *     summary: Get order statistics (officer only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get('/statistics', [auth, officerAuth], async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [dailyStats, monthlyStats, totalStats, statusStats] = await Promise.all([
            // Daily statistics
            Order.aggregate([
                { $match: { createdAt: { $gte: startOfDay } } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$total' }
                    }
                }
            ]),
            // Monthly statistics
            Order.aggregate([
                { $match: { createdAt: { $gte: startOfMonth } } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$total' }
                    }
                }
            ]),
            // Total statistics
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$total' },
                        averageOrderValue: { $avg: '$total' }
                    }
                }
            ]),
            // Status distribution
            Order.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        res.json({
            daily: dailyStats[0] || { totalOrders: 0, totalRevenue: 0 },
            monthly: monthlyStats[0] || { totalOrders: 0, totalRevenue: 0 },
            total: totalStats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
            statusDistribution: statusStats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {})
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/orders/{id}/receipt:
 *   post:
 *     summary: Generate receipt for order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/receipt', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user')
            .populate('items.plant');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (req.user.role !== 'officer' && order.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Generate receipt if not already generated
        if (!order.receipt) {
            const receipt = await Receipt.create({
                order: order._id,
                items: order.items.map(item => ({
                    name: item.plant.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                total: order.total,
                customerName: order.user.name,
                orderNumber: order.orderNumber
            });

            order.receipt = receipt._id;
            await order.save();
        }

        res.json({ message: 'Receipt generated successfully', receipt: order.receipt });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;