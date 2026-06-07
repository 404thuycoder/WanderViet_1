const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const Place = require('../server/models/Place');
  const BusinessAccount = require('../server/models/BusinessAccount');

  const biz = await BusinessAccount.findOne({ email: 'tongtrang@gmail.com' });
  const places = await Place.find({ ownerId: biz.customId });
  
  places.forEach((p, idx) => {
    console.log(`\n--- PLACE ${idx + 1} ---`);
    console.log(JSON.stringify(p.toObject(), null, 2));
  });

  await mongoose.disconnect();
}

run().catch(console.error);
