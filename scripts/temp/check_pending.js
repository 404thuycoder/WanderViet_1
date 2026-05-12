const mongoose = require('mongoose');
require('dotenv').config();
const Place = require('../models/Place');
const BusinessAccount = require('../models/BusinessAccount');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI.trim());
  console.log('Connected to DB');

  const partnerPlaces = await Place.find({ source: 'partner' }).lean();
  console.log(`Found ${partnerPlaces.length} partner places`);

  for (const p of partnerPlaces) {
    console.log(`- Place: ${p.name}, ID: ${p.id}, ownerId: ${p.ownerId}, status: ${p.status}`);
    const biz = await BusinessAccount.findOne({
      $or: [
        { customId: p.ownerId },
        { id: p.ownerId },
        ...(mongoose.Types.ObjectId.isValid(p.ownerId) ? [{ _id: p.ownerId }] : [])
      ]
    });
    if (biz) {
      console.log(`  Owner found: ${biz.name} (customId: ${biz.customId}, _id: ${biz._id})`);
    } else {
      console.log(`  Owner NOT FOUND for ownerId: ${p.ownerId}`);
    }
  }

  process.exit(0);
}

check();
