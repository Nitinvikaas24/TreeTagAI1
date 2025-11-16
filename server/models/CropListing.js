import mongoose from 'mongoose';

const cropListingSchema = new mongoose.Schema({
  officer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plantName: {
    type: String,
    required: true,
    trim: true
  },
  scientificName: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  priceSource: {
    type: String,
    enum: ['receipt', 'manual'],
    required: true
  },
  images: [{
    url: String,
    filename: String
  }],
  identificationData: {
    // Store the original plant identification result
    apiResult: mongoose.Schema.Types.Mixed,
    confidence: Number,
    identificationService: String,
    wasManualOverride: {
      type: Boolean,
      default: false
    }
  },
  receiptData: {
    filename: String,
    extractedPrice: Number,
    uploadDate: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'sold'],
    default: 'active'
  },
  quantity: {
    type: Number,
    default: 1,
    min: 0
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number]
    }
  },
  metadata: {
    category: String,
    season: String,
    growthStage: String,
    notes: String
  }
}, {
  timestamps: true
});

// Index for geospatial queries and text search
cropListingSchema.index({ location: '2dsphere' });
cropListingSchema.index({ plantName: 'text', scientificName: 'text' });
cropListingSchema.index({ officer: 1, status: 1 });

export default mongoose.model('CropListing', cropListingSchema);
