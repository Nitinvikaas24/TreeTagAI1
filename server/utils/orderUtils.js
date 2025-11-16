import crypto from 'crypto';
import Order from '../models/Order.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Generate a unique order number
 * Format: TREE-YYYYMMDD-XXXXX (where X is a random number)
 */
export const generateOrderNumber = async () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    const orderNumber = `TREE-${year}${month}${day}-${random}`;
    
    // Ensure uniqueness
    const existingOrder = await Order.findOne({ orderNumber });
    if (existingOrder) {
        return generateOrderNumber(); // Try again if number exists
    }
    
    return orderNumber;
};

/**
 * Generate a PDF receipt for an order
 */
export const generateReceipt = async (order) => {
    // Create a unique filename
    const filename = `receipt-${order.orderNumber}.pdf`;
    const filePath = path.join('uploads', 'receipts', filename);
    
    // Ensure directory exists
    if (!fs.existsSync(path.join('uploads', 'receipts'))) {
        fs.mkdirSync(path.join('uploads', 'receipts'), { recursive: true });
    }
    
    // Create PDF document
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    
    return new Promise((resolve, reject) => {
        doc.pipe(stream);
        
        // Add header
        doc.fontSize(20)
           .text('TreeTagAI - Smart Nursery', { align: 'center' })
           .moveDown();
        
        // Add order details
        doc.fontSize(12)
           .text(`Order Number: ${order.orderNumber}`)
           .text(`Date: ${order.createdAt.toLocaleDateString()}`)
           .moveDown();
        
        // Add customer details
        doc.text(`Customer: ${order.user.name}`)
           .text(`Email: ${order.user.email}`)
           .text(`Shipping Address: ${order.shippingAddress}`)
           .moveDown();
        
        // Add items table
        doc.text('Items:', { underline: true })
           .moveDown();
        
        order.items.forEach(item => {
            doc.text(`${item.plant.name} x ${item.quantity}`)
               .text(`Price: ₹${item.priceAtOrder} each`)
               .text(`Subtotal: ₹${item.priceAtOrder * item.quantity}`)
               .moveDown();
        });
        
        // Add total
        doc.moveDown()
           .text(`Total Amount: ₹${order.totalAmount}`, { bold: true });
        
        // Add footer
        doc.moveDown()
           .fontSize(10)
           .text('Thank you for shopping with TreeTagAI!', { align: 'center' });
        
        // Finalize PDF
        doc.end();
        
        stream.on('finish', () => {
            resolve(`/uploads/receipts/${filename}`);
        });
        
        stream.on('error', reject);
    });
};

/**
 * Calculate order statistics
 */
export const calculateOrderStats = async (startDate, endDate) => {
    const stats = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" },
                averageOrderValue: { $avg: "$totalAmount" },
                itemsSold: { $sum: { $size: "$items" } }
            }
        }
    ]);
    
    return stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        itemsSold: 0
    };
};

/**
 * Get daily sales report
 */
export const getDailySalesReport = async (date) => {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    return Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startOfDay, $lte: endOfDay },
                status: { $ne: 'cancelled' }
            }
        },
        {
            $unwind: "$items"
        },
        {
            $group: {
                _id: "$items.plant",
                quantity: { $sum: "$items.quantity" },
                revenue: { $sum: { $multiply: ["$items.quantity", "$items.priceAtOrder"] } }
            }
        },
        {
            $lookup: {
                from: "plants",
                localField: "_id",
                foreignField: "_id",
                as: "plantDetails"
            }
        },
        {
            $unwind: "$plantDetails"
        },
        {
            $project: {
                plantName: "$plantDetails.name",
                quantity: 1,
                revenue: 1
            }
        },
        {
            $sort: { revenue: -1 }
        }
    ]);
};