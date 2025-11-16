import mongoose from 'mongoose';

const plantSchema = new mongoose.Schema(
  {
    scientific_name: { type: String, required: true, unique: true },
    common_names: [String],
    price_default: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('Plant', plantSchema);