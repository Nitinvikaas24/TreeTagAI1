import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, unique: true }, // Unique Invoice #
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to Seller
    customerName: { type: String }, // Buyer Name
    
    // Support for both old 'items' and new 'plants' structure for compatibility
    items: [{
      plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
      name: String,
      quantity: Number,
      pricePerUnit: Number,
      total: Number
    }],
    
    totalAmount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    
    // --- BLOCKCHAIN AUTHENTICATION FIELDS ---
    blockchainHash: { type: String }, // The "Digital Signature"
    digitalPassportId: { type: String }, // Unique Asset ID
    verificationUrl: { type: String }, // Link to verify (mock)
    
    pdfUrl: { type: String },
    language: { type: String, default: 'en' }
  },
  { timestamps: true }
);

export default mongoose.model('Receipt', receiptSchema);