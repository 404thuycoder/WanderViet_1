require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // Fix: set ownerId=null for all system places that have 'Hệ thống (System)' as ownerId
  const result = await db.collection('places').updateMany(
    { ownerId: 'Hệ thống (System)', source: 'system' },
    { $set: { ownerId: null } }
  );
  console.log(`✅ Fixed ${result.modifiedCount} system places: ownerId → null`);

  // Verify
  const withOwner = await db.collection('places').countDocuments({ ownerId: { $ne: null } });
  const biz = await db.collection('places').find({ source: 'partner' }).count();
  const sys = await db.collection('places').find({ source: 'system' }).count();
  console.log(`\n📊 Summary: Partner places: ${biz}, System places: ${sys}, Places with ownerId: ${withOwner}`);

  mongoose.connection.close();
}).catch(console.error);
