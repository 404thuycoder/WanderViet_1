const mongoose = require('mongoose');
const Place = require('./models/Place');
require('dotenv').config();

async function checkPartnerImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const places = await Place.find({ ownerId: { $exists: true, $ne: null } });
    places.forEach(p => {
      console.log(`${p.name} | ${p.image} | ${p._id}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkPartnerImages();
