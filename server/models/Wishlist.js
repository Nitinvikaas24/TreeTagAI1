import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    plants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plant'
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
wishlistSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;