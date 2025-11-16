import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true
    },
    registrationNumber: {
        type: String,
        required: [true, 'Registration number is required'],
        unique: true
    },
    logo: {
        data: Buffer,
        contentType: String,
        lastUpdated: Date
    },
    businessDetails: {
        type: {
            type: String,
            enum: ['Nursery', 'Garden Center', 'Agriculture Store'],
            default: 'Nursery'
        },
        gstNumber: String,
        panNumber: String,
        established: Date
    },
    contact: {
        email: {
            type: String,
            required: true,
            lowercase: true
        },
        phone: {
            type: String,
            required: true
        },
        website: String,
        socialMedia: {
            facebook: String,
            instagram: String,
            twitter: String
        }
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: {
            type: String,
            default: 'India'
        },
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    receiptSettings: {
        template: {
            type: String,
            enum: ['standard', 'professional', 'minimal'],
            default: 'professional'
        },
        primaryColor: {
            type: String,
            default: '#008000' // Green color for nursery theme
        },
        secondaryColor: {
            type: String,
            default: '#4CAF50'
        },
        footer: {
            text: String,
            showQR: {
                type: Boolean,
                default: true
            },
            showMap: {
                type: Boolean,
                default: false
            }
        },
        additionalInfo: [{
            label: String,
            value: String,
            showOnReceipt: {
                type: Boolean,
                default: true
            }
        }]
    },
    officers: [{
        officerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['manager', 'sales', 'inventory'],
            default: 'sales'
        },
        assignedArea: String,
        active: {
            type: Boolean,
            default: true
        }
    }]
}, {
    timestamps: true
});

// Create index for efficient queries
companySchema.index({ 'officers.officerId': 1 });
companySchema.index({ registrationNumber: 1 });

export const Company = mongoose.model('Company', companySchema);