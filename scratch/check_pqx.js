const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const Place = require('../server/models/Place');
  const BusinessAccount = require('../server/models/BusinessAccount');

  const places = await Place.find({ ownerId: 'BIZ-RENTAL-PQ' });
  console.log('\n--- PLACES OWNED BY BIZ-RENTAL-PQ ---');
  places.forEach(p => {
    console.log(`ID: ${p.id}, Name: ${p.name}, lat: ${p.lat}, lng: ${p.lng}, gpsCoordinates: ${JSON.stringify(p.gpsCoordinates)}`);
    console.log(`Region: ${p.region}, City: ${p.city}, Address: ${p.address}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
