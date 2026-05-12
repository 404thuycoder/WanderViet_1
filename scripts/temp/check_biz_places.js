const mongoose = require('mongoose');
require('dotenv').config();
const Place = require('../models/Place');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI.trim());
  console.log('Connected to DB');

  const places = await Place.find({ ownerId: 'business43113762' }).lean();
  console.log(`Found ${places.length} places for business43113762:`);
  places.forEach(p => {
    console.log(`- Name: ${p.name}, Status: ${p.status}, Source: ${p.source}`);
  });

  process.exit(0);
}

check();
