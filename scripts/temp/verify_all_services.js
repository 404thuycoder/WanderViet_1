require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  
  // Group places by owner
  const places = await db.collection('places').find({ ownerId: { $ne: null } }).toArray();
  const byOwner = {};
  places.forEach(p => {
    if (!byOwner[p.ownerId]) byOwner[p.ownerId] = [];
    byOwner[p.ownerId].push({ name: p.name, kind: p.kind, id: p.id });
  });

  console.log('=== Partner places grouped by owner ===');
  for (const [ownerId, items] of Object.entries(byOwner)) {
    console.log(`\nOwner: ${ownerId} (${items.length} places):`);
    items.forEach(p => console.log(`  - [${p.kind}] ${p.name} (id: ${p.id})`));
  }

  // Also check new seeded services exist
  const newIds = ['halong-seaplane-001','halong-sunworld-001','halong-dinner-001','halong-squid-001','halong-spa-001','tuyenquang-hotel-001'];
  console.log('\n=== New seeded services check ===');
  for (const id of newIds) {
    const p = await db.collection('places').findOne({ id });
    if (p) {
      console.log(`✅ FOUND: "${p.name}" | image: ${p.image ? 'OK' : 'MISSING'} | images: ${(p.images||[]).length} items`);
    } else {
      console.log(`❌ MISSING: ${id}`);
    }
  }

  mongoose.connection.close();
}).catch(console.error);
