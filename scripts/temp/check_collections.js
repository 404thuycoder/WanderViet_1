require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('Collections in database:');
  collections.forEach(c => console.log(' -', c.name));

  // If 'services' or similar collection exists, print count and some sample names
  for (const coll of collections) {
    if (coll.name !== 'places') {
      const count = await db.collection(coll.name).countDocuments();
      if (count > 0) {
        const samples = await db.collection(coll.name).find().limit(3).toArray();
        console.log(`\nCollection: ${coll.name} (Count: ${count})`);
        console.log('Samples:', samples.map(s => s.name || s.title || s._id));
      }
    }
  }

  mongoose.connection.close();
}).catch(console.error);
