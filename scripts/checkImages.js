const mongoose = require('mongoose');
const Place = require('./models/Place');
require('dotenv').config();

async function checkImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const places = await Place.find({});
    places.forEach(p => {
      console.log(`${p.name} | ${p.image}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkImages();
