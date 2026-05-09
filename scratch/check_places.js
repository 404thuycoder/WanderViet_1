const mongoose = require('mongoose');
const Place = require('./models/Place');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const places = await Place.find({ ownerId: { $exists: true, $ne: null }, status: 'approved' }).select('name isTour kind status ownerId');
  console.log(places);
  process.exit(0);
});
