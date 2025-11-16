import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
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
        }
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate total
cartSchema.virtual('total').get(function() {
    return this.items.reduce((total, item) => {
        return total + (item.plant.price * item.quantity);
    }, 0);
});

// Update timestamp on save
cartSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;