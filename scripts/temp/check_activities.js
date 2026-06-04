require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // Check businessactivities
  const activities = await db.collection('businessactivities').find().limit(10).toArray();
  console.log('=== businessactivities (10 mẫu) ===');
  activities.forEach(a => console.log(JSON.stringify({
    type: a.type, ownerId: a.ownerId, placeId: a.placeId, 
    createdAt: a.createdAt
  })));

  // Check by category in services collection
  console.log('\n=== services collection - theo category ===');
  const cats = await db.collection('services').aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  cats.forEach(c => console.log(`  ${c._id}: ${c.count}`));

  // Check places by kind
  console.log('\n=== places collection - theo kind (partner) ===');
  const kinds = await db.collection('places').aggregate([
    { $match: { source: 'partner' } },
    { $group: { _id: '$kind', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  kinds.forEach(k => console.log(`  ${k._id}: ${k.count}`));

  // Check places by kind (all)
  console.log('\n=== places collection - theo kind (tất cả) ===');
  const allKinds = await db.collection('places').aggregate([
    { $group: { _id: '$kind', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  allKinds.forEach(k => console.log(`  ${k._id}: ${k.count}`));

  console.log('\n=== TỔNG ===');
  const totalServices = await db.collection('services').countDocuments();
  const totalPlaces = await db.collection('places').countDocuments();
  const totalActs = await db.collection('businessactivities').countDocuments();
  console.log(`services (legacy): ${totalServices}`);
  console.log(`places (hiện tại): ${totalPlaces}`);
  console.log(`businessactivities: ${totalActs}`);

  mongoose.connection.close();
}).catch(console.error);
