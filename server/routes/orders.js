import express from 'express';
import { auth, officerAuth } from '../middleware/auth.js'; // Ensure your auth middleware passes 'req.user.email'
import { Order } from '../models/Order.js';
import { User } from '../models/user.js';
import { docClient, TABLE_NAME } from "../config/db.js";
import { ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const router = express.Router();

// GET ALL ORDERS
router.get('/', auth, async (req, res) => {
    try {
        let orders;
        
        if (req.user.role === 'officer') {
            // Officer sees ALL orders -> Scan (Expensive but necessary for "All")
            const command = new ScanCommand({
                TableName: TABLE_NAME,
                FilterExpression: 'begins_with(PK, :pk)',
                ExpressionAttributeValues: { ':pk': 'ORDER#' }
            });
            const response = await docClient.send(command);
            orders = response.Items;
        } else {
            // User sees THEIR orders -> Query by Email (GSI)
            orders = await Order.findByUserEmail(req.user.email);
        }

        // Sorting manually (DynamoDB sorts only by SortKey)
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json(orders);
    } catch (error) {
        console.error("Order Fetch Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET SINGLE ORDER
router.get('/:id', auth, async (req, res) => {
    try {
        const command = new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: `ORDER#${req.params.id}`, SK: 'DETAILS' }
        });
        const response = await docClient.send(command);
        const order = response.Item;

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Auth Check: Officer OR Owner (checking email)
        if (req.user.role !== 'officer' && order.user !== req.user.email) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// UPDATE STATUS
router.put('/:id/status', [auth, officerAuth], async (req, res) => {
    try {
        const { status, notes } = req.body;
        const updatedAttributes = await Order.updateStatus(req.params.id, status, notes);
        res.json(updatedAttributes);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// STATISTICS (Replaces Aggregate)
router.get('/statistics', [auth, officerAuth], async (req, res) => {
    try {
        // Fetch ALL orders
        const command = new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'begins_with(PK, :pk)',
            ExpressionAttributeValues: { ':pk': 'ORDER#' }
        });
        const response = await docClient.send(command);
        const orders = response.Items || [];

        // Calculate Stats in JS
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        let dailyStats = { totalOrders: 0, totalRevenue: 0 };
        let monthlyStats = { totalOrders: 0, totalRevenue: 0 };
        let totalStats = { totalOrders: 0, totalRevenue: 0 };
        let statusCounts = {};

        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const total = order.total || 0;

            // Total
            totalStats.totalOrders++;
            totalStats.totalRevenue += total;

            // Daily
            if (orderDate >= startOfDay) {
                dailyStats.totalOrders++;
                dailyStats.totalRevenue += total;
            }

            // Monthly
            if (orderDate >= startOfMonth) {
                monthlyStats.totalOrders++;
                monthlyStats.totalRevenue += total;
            }

            // Status
            const status = order.status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        // Average
        totalStats.averageOrderValue = totalStats.totalOrders > 0 
            ? totalStats.totalRevenue / totalStats.totalOrders 
            : 0;

        res.json({
            daily: dailyStats,
            monthly: monthlyStats,
            total: totalStats,
            statusDistribution: statusCounts
        });

    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GENERATE RECEIPT (Simplified)
router.post('/:id/receipt', auth, async (req, res) => {
    try {
        // Since we don't have a separate Receipt Table in this specific code,
        // we will just acknowledge the request or update the Order to say "receipt generated".
        // If you need a Receipt entity, you'd add a Receipt.create() similar to Order.create
        
        // For MVP: Just return success
        res.json({ message: 'Receipt generated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;