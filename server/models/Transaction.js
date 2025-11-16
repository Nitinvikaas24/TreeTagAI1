import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  officer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cropListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CropListing',
    required: true
  },
  farmerIdentification: {
    // Store the farmer's plant identification attempt
    plantName: String,
    confidence: Number,
    identificationService: String,
    uploadedImage: String
  },
  matchingProcess: {
    exactMatch: Boolean,
    fuzzyScore: Number,
    suggestedCrops: [{
      cropId: mongoose.Schema.Types.ObjectId,
      similarity: Number,
      plantName: String
    }],
    farmerConfirmed: Boolean,
    confirmedCropId: mongoose.Schema.Types.ObjectId
  },
  transactionDetails: {
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    unitPrice: Number,
    totalAmount: Number,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  },
  receipt: {
    pdfPath: String,
    receiptNumber: String,
    generatedAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
transactionSchema.index({ farmer: 1, createdAt: -1 });
transactionSchema.index({ officer: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ 'receipt.receiptNumber': 1 });

export default mongoose.model('Transaction', transactionSchema);
