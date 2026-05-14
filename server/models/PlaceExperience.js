const mongoose = require('mongoose');

const placeExperienceSchema = new mongoose.Schema({
  placeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  title: { type: String, required: true },
  description: String,
  icon: String,
  image: String,
  duration: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  priceEstimate: Number,
  recommendedTime: String,
  tags: [String],
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

placeExperienceSchema.index({ placeId: 1, order: 1 });

module.exports = mongoose.model('PlaceExperience', placeExperienceSchema);
