const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const Place = require('../server/models/Place');
  const place = await Place.findById('69fed77fb5310f95e5619b4c');
  if (place) {
    console.log("Gallery field content:");
    console.log(JSON.stringify(place.gallery, null, 2));
  }
  process.exit(0);
}).catch(console.error);
