const mongoose = require('mongoose');

const placeTipSchema = new mongoose.Schema({
  placeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  title: String,
  content: { type: String, required: true },
  category: { type: String, enum: ['safety', 'weather', 'scam', 'packing', 'etiquette', 'general'], default: 'general' },
  severity: { type: String, enum: ['info', 'warning', 'danger'], default: 'info' },
  createdAt: { type: Date, default: Date.now }
});

placeTipSchema.index({ placeId: 1, category: 1 });

module.exports = mongoose.model('PlaceTip', placeTipSchema);
