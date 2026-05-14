const mongoose = require('mongoose');

const placeGallerySchema = new mongoose.Schema({
  placeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  url: { type: String, required: true },
  thumbnail: String,
  type: { type: String, enum: ['image', 'video', '360', 'reel'], default: 'image' },
  category: { type: String, enum: ['food', 'nature', 'hotel', 'nightlife', 'beach', 'adventure', 'general'], default: 'general' },
  caption: String,
  isCover: { type: Boolean, default: false },
  uploadedBy: String, // userId
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

placeGallerySchema.index({ placeId: 1, type: 1 });

module.exports = mongoose.model('PlaceGallery', placeGallerySchema);
