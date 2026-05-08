const mongoose = require('mongoose');
require('dotenv').config();
const Place = require('../models/Place');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI.trim());
  console.log('Connected to DB');

  const result = await Place.updateMany(
    { source: 'partner' },
    { $set: { status: 'pending' } }
  );
  console.log(`Updated ${result.modifiedCount} partner places to pending status.`);

  process.exit(0);
}

fix();
