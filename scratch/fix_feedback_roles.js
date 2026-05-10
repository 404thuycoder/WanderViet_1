require('dotenv').config();
const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');

mongoose.connect(process.env.MONGODB_URI.trim()).then(async () => {
  // Fix records that have role=business but NO businessId — they belong to system tab
  const result = await Feedback.updateMany(
    { role: 'business', $or: [{ businessId: null }, { businessId: { $exists: false } }, { businessId: '' }] },
    { $set: { role: 'user' } }
  );
  console.log('Fixed', result.modifiedCount, 'records with wrong role');

  const all = await Feedback.find();
  for (let f of all) {
    console.log('ID:', f._id, '| role:', f.role, '| businessId:', f.businessId, '| msg:', f.message.substring(0, 40));
  }
  process.exit(0);
});
