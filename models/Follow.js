const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  followerId: { type: String, required: true, index: true }, // User ID (CustomId or ObjectId)
  businessId: { type: String, required: true, index: true }, // Business ID (CustomId or ObjectId)
  createdAt:  { type: Date, default: Date.now }
});

// Prevent duplicate follows
followSchema.index({ followerId: 1, businessId: 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema);
