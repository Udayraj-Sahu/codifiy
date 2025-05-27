const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    user: { // Changed from userId to user for conventional naming
        type: Schema.Types.ObjectId,
        ref: 'User', // Assuming your User model is named 'User'
        required: true
    },
    bike: { // Changed from bikeId to bike
        type: Schema.Types.ObjectId,
        ref: 'Bike', // Assuming your Bike model is named 'Bike'
        required: true
    },
    booking: { // Changed from bookingId to booking, and made it unique as one review per booking
        type: Schema.Types.ObjectId,
        ref: 'Booking', // Assuming your Booking model is named 'Booking'
        required: true,
        unique: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000 // Optional: set a max length for comments
    }
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

// Index for querying reviews by bike or user
reviewSchema.index({ bike: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });

// Static method to calculate average rating for a bike - you'd call this after a new review is saved
reviewSchema.statics.calculateAverageRating = async function(bikeId) {
    const Bike = mongoose.model('Bike'); // Important: Ensure Bike model is registered
    try {
        const stats = await this.aggregate([
            { $match: { bike: bikeId } },
            {
                $group: {
                    _id: '$bike',
                    numberOfReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' }
                }
            }
        ]);

        if (stats.length > 0) {
            await Bike.findByIdAndUpdate(bikeId, {
                numberOfReviews: stats[0].numberOfReviews,
                averageRating: parseFloat(stats[0].averageRating.toFixed(1)) // Round to one decimal place
            });
        } else {
            // If no reviews, reset to defaults
            await Bike.findByIdAndUpdate(bikeId, {
                numberOfReviews: 0,
                averageRating: 0
            });
        }
    } catch (error) {
        console.error("Error calculating average rating:", error);
    }
};

// Middleware to call calculateAverageRating after a review is saved or removed
reviewSchema.post('save', async function() {
    // 'this.constructor' refers to the model (Review)
    // 'this.bike' refers to the bikeId in the current review document
    await this.constructor.calculateAverageRating(this.bike);
});

// If you implement review deletion, you'd also want a post('remove') hook or similar logic
// For findByIdAndUpdate/findByIdAndDelete, a different middleware approach is needed if you update/delete reviews that way
// Example for findOneAndRemove or findByIdAndDelete (pre hook)
reviewSchema.pre('findOneAndDelete', async function(next) {
    // 'this.getQuery()' gets the query conditions, e.g., { _id: reviewId }
    // We need to find the document first to get the bikeId before it's deleted
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete) {
        // Store bikeId to use in post hook, or pass it via options if possible
        // A common pattern is to attach it to the query object if the driver/library supports it, or fetch it again in post
        this._bikeIdForUpdate = docToDelete.bike;
    }
    next();
});

reviewSchema.post('findOneAndDelete', async function() {
    if (this._bikeIdForUpdate) {
        await mongoose.model('Review').calculateAverageRating(this._bikeIdForUpdate);
    }
});


const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;