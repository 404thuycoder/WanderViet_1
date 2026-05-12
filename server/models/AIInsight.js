const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  type: { type: String, enum: ['trend', 'price', 'prediction', 'suggestion', 'anomaly'], required: true },
  title: { type: String },
  content: { type: String },
  reason: { type: String },
  metrics: {
    value: Number,
    previousValue: Number,
    percentChange: Number
  },
  isActionTaken: { type: Boolean, default: false },
  effectiveness: { type: Number, default: null }, // 0-100 rating after action
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AIInsight', aiInsightSchema);
