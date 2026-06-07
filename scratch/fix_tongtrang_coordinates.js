const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const Place = require('../server/models/Place');
  const BusinessAccount = require('../server/models/BusinessAccount');

  const biz = await BusinessAccount.findOne({ email: 'tongtrang@gmail.com' });
  if (!biz) {
    console.log('Business Tông Trang Thôn not found.');
    await mongoose.disconnect();
    return;
  }

  console.log('Updating coordinates for Tông Trang Thôn services...');
  const result = await Place.updateMany(
    { ownerId: biz.customId },
    { 
      $set: { 
        lat: 20.8542, 
        lng: 104.6465,
        gpsCoordinates: {
          lat: 20.8542,
          lng: 104.6465
        }
      } 
    }
  );
  
  console.log('Updated services count:', result.modifiedCount);
  await mongoose.disconnect();
}

run().catch(console.error);
