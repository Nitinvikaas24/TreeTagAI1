import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        plant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Plant',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'processing'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'upi', 'card', 'netbanking'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },
    trackingNumber: String,
    notes: String,
    orderNumber: {
        type: String,
        unique: true
    },
    receipt: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Receipt'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Generate unique order number before saving
orderSchema.pre('save', async function(next) {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `ORD${year}${month}${(count + 1).toString().padStart(4, '0')}`;
    }
    this.updatedAt = Date.now();
    next();
});

// Add status change tracking
orderSchema.methods.updateStatus = async function(newStatus, notes) {
    this.status = newStatus;
    if (notes) {
        this.notes = this.notes ? `${this.notes}\n${notes}` : notes;
    }
    await this.save();
};

const Order = mongoose.model('Order', orderSchema);

export default Order;