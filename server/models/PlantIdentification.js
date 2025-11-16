import mongoose from 'mongoose';

const plantIdentificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalImage: {
    type: String,
    required: true
  },
  identifiedPlant: {
    scientificName: String,
    commonName: String,
    probability: Number,
    subtype: String,
    translatedName: {
      type: Map,
      of: String,
      default: {}
    }
  },
  apiResponse: {
    type: mongoose.Schema.Types.Mixed,
    select: false // Don't include in normal queries
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  error: {
    type: String
  }
}, {
  timestamps: true
});

const PlantIdentification = mongoose.model('PlantIdentification', plantIdentificationSchema);
export default PlantIdentification;