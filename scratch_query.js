const mongoose = require('mongoose');
require('dotenv').config();
const Place = require('./server/models/Place');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  let topPlaces = await Place.find({ top: true }).limit(10).lean();
  if (topPlaces.length < 5) {
    topPlaces = await Place.find({}).limit(10).lean();
  }
  console.log('--- Slideshow Places ---');
  topPlaces.forEach(p => {
    console.log(`- Place: ${p.name} (ID: ${p.id || p._id})`);
    console.log(`  image: ${p.image}`);
    console.log(`  images: ${JSON.stringify(p.images)}`);
  });
  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
