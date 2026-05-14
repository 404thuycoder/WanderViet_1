const mongoose = require('mongoose');

const placeNearbySchema = new mongoose.Schema({
  placeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  nearbyPlaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  distance: Number, // in meters
  travelTime: String, // e.g. "5 mins walk"
  category: { type: String, enum: ['restaurant', 'hotel', 'cafe', 'attraction', 'utility'], required: true },
  createdAt: { type: Date, default: Date.now }
});

placeNearbySchema.index({ placeId: 1, category: 1 });

module.exports = mongoose.model('PlaceNearby', placeNearbySchema);
