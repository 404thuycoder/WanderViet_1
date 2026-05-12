const mongoose = require('mongoose');
require('dotenv').config();
const Place = require('../models/Place');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI.trim());
  console.log('Connected to DB');

  const counts = await Place.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);
  console.log('Place counts by status:', counts);

  const sources = await Place.aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } }
  ]);
  console.log('Place counts by source:', sources);

  const recentPending = await Place.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5).lean();
  console.log('Recent pending places:', recentPending.map(p => ({ name: p.name, source: p.source, createdAt: p.createdAt })));

  process.exit(0);
}

check();
