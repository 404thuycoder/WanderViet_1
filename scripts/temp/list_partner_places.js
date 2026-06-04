require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const places = await db.collection('places').find({ ownerId: { $ne: null } }).toArray();
  console.log('Total business/partner places: ' + places.length);
  places.forEach(p => {
    console.log(` - name: "${p.name}" | kind: "${p.kind}" | ownerId: "${p.ownerId}" | status: "${p.status}" | source: "${p.source}"`);
  });
  mongoose.connection.close();
}).catch(console.error);
