const mongoose = require('mongoose');
const Place = require('./models/Place');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

async function findPartnerPlaces() {
  if (!MONGO_URI) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGO_URI);
    const places = await Place.find({ ownerId: { $exists: true, $ne: null } });
    console.log(JSON.stringify(places, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findPartnerPlaces();
