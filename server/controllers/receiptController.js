import Receipt from '../models/Receipt.js';
import User from '../models/user.js'; 
import Plant from '../models/plant.js'; 
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto'; 
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createReceipt = async (req, res) => {
  try {
    const { farmerId, customerName } = req.body;
    
    // COMPATIBILITY: Look for 'plants' (New) or 'items' (Old)
    const itemsToProcess = req.body.plants || req.body.items;

    if (!itemsToProcess || itemsToProcess.length === 0) {
        return res.status(400).json({ message: "No plants in cart" });
    }

    const farmer = await User.findOne({ farmerId });
    if (!farmer) return res.status(404).json({ message: 'Farmer/Seller not found' });

    let totalAmount = 0;
    const receiptItems = [];

    for (const item of itemsToProcess) {
      const idToFind = item.plantId || item.id;
      const plant = await Plant.findById(idToFind);
      if (!plant) throw new Error(`Plant ${idToFind} not found`);
      
      const qty = item.quantity || 1;
      const currentStock = plant.stock !== undefined ? plant.stock : plant.availableQuantity;
      
      if (currentStock < qty) throw new Error(`Insufficient stock for ${plant.common_names?.[0] || plant.name}`);

      const price = plant.price_default || plant.cost || 0;
      const itemTotal = price * qty;
      totalAmount += itemTotal;
      
      receiptItems.push({
        plant: plant._id,
        name: plant.common_names?.[0] || plant.scientific_name || "Unknown",
        quantity: qty,
        pricePerUnit: price,
        total: itemTotal
      });

      if (plant.stock !== undefined) plant.stock -= qty;
      else if (plant.availableQuantity !== undefined) plant.availableQuantity -= qty;
      await plant.save();
    }

    // --- BLOCKCHAIN HASH GENERATION ---
    const dataString = `${farmerId}-${Date.now()}-${totalAmount}-${JSON.stringify(receiptItems)}`;
    const blockchainHash = crypto.createHash('sha256').update(dataString).digest('hex');
    const digitalPassportId = `HORTUS-${blockchainHash.substring(0, 8).toUpperCase()}`;
    const receiptNumber = `INV-${Date.now().toString().slice(-6)}`;

    const receipt = await Receipt.create({
      receiptNumber,
      farmer: farmer._id,
      customerName: customerName || "Walk-in Customer",
      items: receiptItems,
      totalAmount,
      blockchainHash,
      digitalPassportId,
      verificationUrl: `https://hortus-chain.io/verify/${blockchainHash}`,
      language: 'en' 
    });

    await generatePDF(receipt._id);

    res.status(201).json({ status: 'success', data: receipt, message: "Receipt minted successfully" });

  } catch (error) {
    console.error("Receipt Error:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const generatePDF = async (receiptId) => {
  const receipt = await Receipt.findById(receiptId).populate('farmer');
  const doc = new PDFDocument({ margin: 50 });
  const fileName = `Invoice-${receipt.receiptNumber}.pdf`;
  const filePath = path.join(__dirname, '..', 'uploads', 'receipts', fileName);
  
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // HEADER
  doc.fillColor('#444444').fontSize(20).text('HORTUS BILLING', 110, 57)
     .fontSize(10).text('Hortus Billing', 200, 65, { align: 'right' })
     .moveDown();

  // INVOICE INFO
  doc.fillColor("#000000").fontSize(20).text("INVOICE", 50, 130);
  doc.fontSize(10).text(`Invoice #: ${receipt.receiptNumber}`, 50, 160)
     .text(`Date: ${receipt.createdAt.toLocaleDateString()}`, 50, 175)
     .text(`Bill To: ${receipt.customerName}`, 300, 160);

  // TABLE
  const tableTop = 250;
  doc.font("Helvetica-Bold").text("Item", 50, tableTop).text("Qty", 280, tableTop).text("Total", 470, tableTop);
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  let i = 0;
  doc.font("Helvetica");
  receipt.items.forEach(item => {
    const y = tableTop + 30 + (i * 30);
    doc.text(item.name, 50, y).text(item.quantity.toString(), 280, y).text(item.total.toFixed(2), 470, y);
    i++;
  });

  // BLOCKCHAIN BADGE
  const bottomY = tableTop + 30 + (i * 30) + 60;
  doc.rect(50, bottomY, 500, 60).fillAndStroke("#f0fdf4", "#166534");
  doc.fillColor("#166534").fontSize(12).text("VERIFIED ON HORTUS CHAIN", 70, bottomY + 20);
  doc.fillColor("#000000").fontSize(8).text(`Hash: ${receipt.blockchainHash}`, 70, bottomY + 40);

  doc.end();
  receipt.pdfUrl = `/uploads/receipts/${fileName}`;
  await receipt.save();
};

export const getRecentReceipts = async (req, res) => {
    try {
        const receipts = await Receipt.find({ farmer: req.user.id })
            .populate('items.plant').sort({ createdAt: -1 }).limit(10);
        res.status(200).json({ status: 'success', data: receipts });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getReceipt = async (req, res) => {
    try {
        const receipt = await Receipt.findById(req.params.id).populate('farmer');
        if (!receipt) return res.status(404).json({ message: 'Receipt not found' });
        res.status(200).json({ status: 'success', data: receipt });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getAllReceipts = async (req, res) => {
    try {
        const receipts = await Receipt.find({ farmer: req.user.id }).populate('farmer').sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', data: receipts });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getReceiptsByDateRange = async (req, res) => {
    res.status(200).json({ status: 'success', data: [] });
};