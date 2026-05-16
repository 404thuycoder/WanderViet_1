const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const Place = require('../server/models/Place');
  const place = await Place.findById('69fed77fb5310f95e5619b4c');
  if (place) {
    console.log("Found Place:");
    console.log("name:", place.name);
    console.log("image:", place.image);
    console.log("images:", place.images);
  } else {
    console.log("Place not found.");
  }
  process.exit(0);
}).catch(console.error);
