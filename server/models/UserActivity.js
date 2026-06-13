const mongoose = require('mongoose');
const chatbotDb = require('./dbChatbot'); // Using the same DB connection as other user models

const userActivitySchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    type: { 
        type: String, 
        required: true,
        enum: ['view_place', 'search', 'save_trip', 'booking', 'review', 'social_post', 'share', 'itinerary_gen', 'filter_biz']
    },
    description: { type: String, required: true },
    metadata: {
        placeId: String,
        placeName: String,
        query: String,
        tripId: String,
        bookingId: String,
        url: String
    },
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
});

// Index for faster queries on user's timeline
userActivitySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
