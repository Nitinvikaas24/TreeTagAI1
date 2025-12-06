import Receipt from '../models/Receipt.js';
import User from '../models/user.js';
import Plant from '../models/plant.js';
import docClient from "../config/db.js";
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const TABLE_NAME = "Userdb-dev";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createReceipt = async (req, res) => {
  try {
    const { farmerId, customerName } = req.body;
    const itemsToProcess = req.body.plants || req.body.items;

    if (!itemsToProcess || itemsToProcess.length === 0) {
        return res.status(400).json({ message: "No plants in cart" });
    }

    // 1. Find Farmer using GSI (FARMER#...)
    const farmerQuery = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :fid',
        ExpressionAttributeValues: { ':fid': `FARMER#${farmerId}` }
    });
    const farmerRes = await docClient.send(farmerQuery);
    const farmer = farmerRes.Items?.[0];

    if (!farmer) return res.status(404).json({ message: 'Farmer/Seller not found' });

    let totalAmount = 0;
    const receiptItems = [];

    // 2. Process Items (Check Stock & Calculate Total)
    for (const item of itemsToProcess) {
      // Assuming item.plantId or item.id is the scientific_name (PK)
      const plantId = item.plantId || item.id; 
      
      const plant = await Plant.findByScientificName(plantId);
      
      if (!plant) {
        // Fallback: If ID is not scientific name, you might need a Scan or GSI logic here.
        // For now, assuming Strict Mapping as per conversion plan.
        throw new Error(`Plant ${plantId} not found (Ensure ID is Scientific Name)`);
      }
      
      const qty = item.quantity || 1;
      const currentStock = plant.stock || 0;
      
      if (currentStock < qty) {
        throw new Error(`Insufficient stock for ${plant.common_names?.[0] || plant.scientific_name}`);
      }

      const price = plant.price_default || 0;
      const itemTotal = price * qty;
      totalAmount += itemTotal;
      
      receiptItems.push({
        plant: plant.scientific_name, // Store ID
        name: plant.common_names?.[0] || plant.scientific_name,
        quantity: qty,
        pricePerUnit: price,
        total: itemTotal
      });

      // 3. Update Stock in DynamoDB
      await docClient.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: plant.PK, SK: 'DETAILS' },
          UpdateExpression: "set stock = stock - :qty",
          ExpressionAttributeValues: { ":qty": qty }
      }));
    }

    // 4. Generate Blockchain Hash
    const dataString = `${farmerId}-${Date.now()}-${totalAmount}-${JSON.stringify(receiptItems)}`;
    const blockchainHash = crypto.createHash('sha256').update(dataString).digest('hex');
    const digitalPassportId = `HORTUS-${blockchainHash.substring(0, 8).toUpperCase()}`;
    const receiptNumber = `INV-${Date.now().toString().slice(-6)}`;

    // 5. Create Receipt in DynamoDB
    const receipt = await Receipt.create({
      receiptNumber,
      userEmail: farmer.email, // Link to Farmer's Email
      customerName: customerName || "Walk-in Customer",
      items: receiptItems,
      totalAmount,
      blockchainHash,
      digitalPassportId,
      verificationUrl: `https://hortus-chain.io/verify/${blockchainHash}`,
      pdfUrl: `/uploads/receipts/Invoice-${receiptNumber}.pdf` // Pre-set URL
    });

    // 6. Generate PDF
    await generatePDF(receipt, farmer);

    res.status(201).json({ status: 'success', data: receipt, message: "Receipt minted successfully" });

  } catch (error) {
    console.error("Receipt Error:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Helper to generate PDF
export const generatePDF = async (receipt, farmer) => {
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
     .text(`Date: ${new Date().toLocaleDateString()}`, 50, 175)
     .text(`Bill To: ${receipt.customerName}`, 300, 160)
     .text(`Seller: ${farmer.name}`, 300, 175); // Added Seller Name

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
};

export const getRecentReceipts = async (req, res) => {
    try {
        // Query DynamoDB by User Email
        const receipts = await Receipt.findByUserEmail(req.user.email);
        // Sort in memory (since GSI sort might be Ascending by default, we want newest first)
        // Note: The Model's GSI query had ScanIndexForward: false, so it might be sorted already.
        // But safe to sort here too.
        receipts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.status(200).json({ status: 'success', data: receipts.slice(0, 10) });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getReceipt = async (req, res) => {
    try {
        // Note: params.id here is expected to be the receiptNumber based on our DynamoDB design
        // If frontend sends UUID, this will fail. Frontend should use receiptNumber for URLs.
        const receipt = await Receipt.findByReceiptNumber(req.params.id);
        
        if (!receipt) return res.status(404).json({ message: 'Receipt not found' });
        
        // Manual "populate" of farmer if needed, but for viewing a receipt, 
        // usually the receipt data itself is enough.
        
        res.status(200).json({ status: 'success', data: receipt });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getAllReceipts = async (req, res) => {
    try {
        const receipts = await Receipt.findByUserEmail(req.user.email);
        receipts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.status(200).json({ status: 'success', data: receipts });
    } catch (e) { res.status(500).json({ message: e.message }); }
};