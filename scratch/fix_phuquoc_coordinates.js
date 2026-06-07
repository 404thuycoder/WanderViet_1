const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const Place = require('../server/models/Place');

  const places = await Place.find({ ownerId: 'BIZ-RENTAL-PQ' });
  for (const p of places) {
    let lat = 10.2899;
    let lng = 103.984;

    if (p.address.includes('An Thới') || p.name.includes('Ôtô')) {
      // An Thoi Port
      lat = 10.0089;
      lng = 104.0146;
    } else {
      // Duong To
      lat = 10.1687;
      lng = 103.9747;
    }

    p.lat = lat;
    p.lng = lng;
    p.gpsCoordinates = { lat, lng };
    await p.save();
    console.log(`Updated "${p.name}" to lat: ${lat}, lng: ${lng}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
