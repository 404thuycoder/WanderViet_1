/**
 * Fix ownerId của 4 places được migrate từ services collection.
 * Reassign từ user _id "69f9e209f9188cd08649bf95" (Halong Luxury Vendor)
 * sang businessaccount customId "business43113762" (Ha Long Luxury Hotel)
 */
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // Target business: Ha Long Luxury Hotel
  const TARGET_OWNER_ID = 'business43113762'; // customId of Ha Long Luxury Hotel
  const OLD_OWNER_ID = '69f9e209f9188cd08649bf95'; // old user _id

  const result = await db.collection('places').updateMany(
    { ownerId: OLD_OWNER_ID, source: 'partner' },
    { $set: { ownerId: TARGET_OWNER_ID, updatedAt: new Date() } }
  );

  console.log(`✅ Updated ${result.modifiedCount} places: ownerId → "${TARGET_OWNER_ID}"`);

  // Verify
  const places = await db.collection('places').find({ source: 'partner' }).toArray();
  console.log('\nVerification:');
  places.forEach(p => {
    console.log(`  - "${p.name}" ownerId="${p.ownerId}", status="${p.status}"`);
  });

  mongoose.connection.close();
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
