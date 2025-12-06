import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Receipt } from '../models/Receipt.js'; // Using the DynamoDB Model

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateInventoryReceipt = async (officer, cropListing) => {
  try {
    const doc = new PDFDocument();
    // Unique Receipt #
    const receiptNumber = `INV-OFF-${Date.now().toString().slice(-6)}`;
    const fileName = `${receiptNumber}.pdf`;
    
    // Ensure directory exists
    const uploadDir = path.join(__dirname, '../uploads/receipts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // --- PDF CONTENT ---
    doc.fontSize(20).text('OFFICIAL CROP LISTING RECEIPT', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Receipt #: ${receiptNumber}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Officer: ${officer.name} (${officer.email})`);
    doc.moveDown();
    
    doc.text('---------------------------------------------------');
    doc.fontSize(14).text('CROP DETAILS');
    doc.fontSize(12).text(`Plant Name: ${cropListing.plantName}`);
    doc.text(`Scientific Name: ${cropListing.scientificName}`);
    doc.text(`Quantity Listed: ${cropListing.quantity}`);
    doc.text(`Listing Price: ${cropListing.price}`);
    doc.text(`Price Source: ${cropListing.priceSource}`);
    
    doc.moveDown();
    // Use _id from the cropListing object (which is just a UUID string now)
    doc.fontSize(10).text(`Listing ID: ${cropListing._id}`);
    
    doc.end();

    // Wait for file to be written
    await new Promise((resolve) => writeStream.on('finish', resolve));

    // --- SAVE TO DYNAMODB ---
    // We create a receipt record for this inventory action
    const receiptItem = await Receipt.create({
      receiptNumber,
      userEmail: officer.email, // Link to Officer via Email
      customerName: "Inventory System",
      items: [{
        name: cropListing.plantName,
        quantity: cropListing.quantity,
        pricePerUnit: cropListing.price,
        total: cropListing.quantity * cropListing.price
      }],
      totalAmount: cropListing.quantity * cropListing.price,
      pdfUrl: `/uploads/receipts/${fileName}`,
      // We can add custom fields to the item, DynamoDB is flexible
      type: 'INVENTORY_LISTING' 
    });

    return receiptItem;

  } catch (error) {
    console.error("Receipt Generation Error:", error);
    throw new Error("Failed to generate inventory receipt");
  }
};

export default { generateInventoryReceipt };