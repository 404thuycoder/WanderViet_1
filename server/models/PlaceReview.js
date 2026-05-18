const mongoose = require('mongoose');
console.log('[PlaceReview Model] Initializing Schema (Version: String IDs)');

const placeReviewSchema = new mongoose.Schema({
  placeId: { type: mongoose.Schema.Types.String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.String, required: true, index: true },
  userName: String,
  userAvatar: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  content: { type: String, required: true },
  images: [String],
  videos: [String],
  isVerified: { type: Boolean, default: false },
  suitability: { type: String, enum: ['family', 'couple', 'solo', 'group'] },
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
  aiAnalysis: String,
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  replies: [{
    userId: String,
    userName: String,
    userAvatar: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  createdAt: { type: Date, default: Date.now }
});

placeReviewSchema.index({ placeId: 1, rating: -1 });

module.exports = mongoose.models.PlaceReview || mongoose.model('PlaceReview', placeReviewSchema);
