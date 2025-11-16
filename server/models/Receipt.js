import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema(
  {
    items: [Object],
    total: { type: Number, required: true },
    tax: { type: Number },
    farmerName: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('Receipt', receiptSchema);