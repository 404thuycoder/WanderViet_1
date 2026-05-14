const mongoose = require('mongoose');

const placeReviewSchema = new mongoose.Schema({
  placeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  createdAt: { type: Date, default: Date.now }
});

placeReviewSchema.index({ placeId: 1, rating: -1 });
placeReviewSchema.index({ userId: 1 });

module.exports = mongoose.model('PlaceReview', placeReviewSchema);
