import Receipt from '../models/Receipt.js';
import User from '../models/User.js';
import Plant from '../models/Plant.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { translateText } from '../utils/translate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createReceipt = async (req, res) => {
  try {
    const { plants, farmerId } = req.body;

    // Verify farmer exists
    const farmer = await User.findOne({ farmerId });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    // Calculate total amount and verify plant availability
    let totalAmount = 0;
    const plantDetails = [];

    for (const item of plants) {
      const plant = await Plant.findById(item.plantId);
      if (!plant) {
        return res.status(404).json({ message: `Plant with ID ${item.plantId} not found` });
      }
      if (plant.availableQuantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity for ${plant.name}. Available: ${plant.availableQuantity}` 
        });
      }

      const itemTotal = plant.cost * item.quantity;
      totalAmount += itemTotal;
      plantDetails.push({
        plant: item.plantId,
        quantity: item.quantity,
        pricePerUnit: plant.cost
      });

      // Update plant quantity
      plant.availableQuantity -= item.quantity;
      await plant.save();
    }

    // Create receipt
    const receipt = await Receipt.create({
      farmer: farmer._id,
      plants: plantDetails,
      totalAmount,
      language: farmer.preferredLanguage || 'en'
    });

    // Generate PDF
    await generatePDF(receipt._id);

    res.status(201).json({
      status: 'success',
      data: receipt
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('farmer', 'name farmerId phoneNumber')
      .populate('plants.plant', 'name scientificName cost');

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    res.status(200).json({
      status: 'success',
      data: receipt
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getAllReceipts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const receipts = await Receipt.find()
      .populate('farmer', 'name farmerId phoneNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Receipt.countDocuments();

    res.status(200).json({
      status: 'success',
      results: receipts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: receipts
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getRecentReceipts = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const receipts = await Receipt.find({
      createdAt: { $gte: thirtyDaysAgo }
    })
    .populate('farmer', 'name farmerId phoneNumber')
    .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: receipts.length,
      data: receipts
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getReceiptsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const receipts = await Receipt.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .populate('farmer', 'name farmerId phoneNumber')
    .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: receipts.length,
      data: receipts
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const generatePDF = async (receiptId) => {
  try {
    const receipt = await Receipt.findById(receiptId)
      .populate('farmer', 'name farmerId phoneNumber')
      .populate('plants.plant', 'name scientificName cost');

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    const doc = new PDFDocument();
    const fileName = `receipt-${receipt.receiptNumber}.pdf`;
    const filePath = path.join(__dirname, '..', 'uploads', 'receipts', fileName);
    const writeStream = fs.createWriteStream(filePath);

    // Pipe PDF to writeStream
    doc.pipe(writeStream);

    // Add content to PDF
    doc
      .fontSize(20)
      .text('TreeTagAI - Smart Nursery Receipt', { align: 'center' })
      .moveDown();

    doc
      .fontSize(12)
      .text(`Receipt Number: ${receipt.receiptNumber}`)
      .text(`Date: ${receipt.createdAt.toLocaleDateString()}`)
      .text(`Farmer ID: ${receipt.farmer.farmerId}`)
      .text(`Name: ${receipt.farmer.name}`)
      .text(`Phone: ${receipt.farmer.phoneNumber}`)
      .moveDown();

    // Table header
    doc
      .text('Plant', 100, doc.y)
      .text('Quantity', 300, doc.y)
      .text('Price', 400, doc.y)
      .text('Total', 500, doc.y)
      .moveDown();

    // Table content
    let y = doc.y;
    receipt.plants.forEach(item => {
      doc
        .text(item.plant.name, 100, y)
        .text(item.quantity.toString(), 300, y)
        .text(item.pricePerUnit.toString(), 400, y)
        .text((item.quantity * item.pricePerUnit).toString(), 500, y);
      y += 20;
    });

    doc
      .moveDown()
      .text(`Total Amount: ${receipt.totalAmount}`, { align: 'right' });

    // Finalize PDF
    doc.end();

    // Update receipt with PDF URL
    receipt.pdfUrl = `/uploads/receipts/${fileName}`;
    await receipt.save();

    return filePath;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};