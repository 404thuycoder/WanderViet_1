require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // Check all places with source = partner
  const partnerPlaces = await db.collection('places').find({ source: 'partner' }).toArray();
  console.log(`Partner places: ${partnerPlaces.length}`);
  partnerPlaces.forEach(p => {
    console.log(`  - name: "${p.name}", ownerId: "${p.ownerId}", status: "${p.status}", kind: "${p.kind}"`);
  });

  // Also check legacyServiceId
  const migratedPlaces = await db.collection('places').find({ legacyServiceId: { $exists: true } }).toArray();
  console.log(`\nMigrated places (has legacyServiceId): ${migratedPlaces.length}`);
  migratedPlaces.forEach(p => {
    console.log(`  - "${p.name}" legacyServiceId="${p.legacyServiceId}", ownerId="${p.ownerId}"`);
  });

  mongoose.connection.close();
}).catch(console.error);
