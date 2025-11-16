import mongoose from 'mongoose';
import Plant from '../models/plant.js';
import Receipt from '../models/Receipt.js';
import { buildReceiptPDF } from '../utils/receiptGenerator.js';

export async function createReceipt(cartData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Loop through items and update stock
    for (const item of cartData.items) {
      // Find the plant by its REAL MongoDB _id
      const plant = await Plant.findById(item.id).session(session);

      if (!plant) {
        throw new Error(`Plant not found: ${item.plantName}`);
      }

      if (plant.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.plantName}`);
      }

      plant.stock -= item.quantity;
      await plant.save({ session });
    }

    // Create the new receipt
    const newReceipt = new Receipt({
      items: cartData.items,
      total: cartData.total,
      tax: cartData.tax,
      farmerName: cartData.farmerName,
    });
    await newReceipt.save({ session });

    // If everything is good, commit the transaction
    await session.commitTransaction();
    session.endSession();
    // Generate the PDF buffer in memory
    const pdfBuffer = await buildReceiptPDF(newReceipt);
    console.log('PDF generated, size:', pdfBuffer.length, 'bytes');

    // Return the receipt object PLUS the PDF data
    return {
      ...newReceipt.toObject(),
      pdfBase64: pdfBuffer.toString('base64'),
    };

  } catch (error) {
    // If anything fails, abort the transaction
    await session.abortTransaction();
    session.endSession();
    throw new Error(error.message || 'Failed to create receipt');
  }
}