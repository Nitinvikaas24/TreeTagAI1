import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Path `name` is required.'],
    },
    username: {
      type: String,
      required: [true, 'Path `username` is required.'],
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['farmer', 'officer', 'admin'],
      default: 'farmer',
    },
    
    // --- THIS IS THE FIX ---
    // We are adding the 'farmerId' field to the database model
    farmerId: {
      type: String,
      unique: true,
      sparse: true, // This allows 'null' values, so officers (who have no farmerId) don't cause an error
    },
    // --- END OF FIX ---

    preferences: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

export default mongoose.model('User', userSchema);