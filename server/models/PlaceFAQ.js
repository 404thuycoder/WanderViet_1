const mongoose = require('mongoose');

const placeFAQSchema = new mongoose.Schema({
  placeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  isAiGenerated: { type: Boolean, default: false },
  helpfulVotes: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

placeFAQSchema.index({ placeId: 1, order: 1 });

module.exports = mongoose.model('PlaceFAQ', placeFAQSchema);
