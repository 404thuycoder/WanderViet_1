const mongoose = require('mongoose');

const placeItinerarySchema = new mongoose.Schema({
  placeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['couple', 'family', 'solo', 'group', 'budget', 'luxury', 'general'], default: 'general' },
  durationDays: { type: Number, default: 1 },
  days: [{
    dayNumber: Number,
    activities: [{
      time: String,
      title: String,
      detail: String,
      location: String,
      image: String
    }]
  }],
  isAiGenerated: { type: Boolean, default: false },
  popularity: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

placeItinerarySchema.index({ placeId: 1, type: 1 });

module.exports = mongoose.model('PlaceItinerary', placeItinerarySchema);
