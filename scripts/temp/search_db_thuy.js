require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const places = await db.collection('places').find({ name: /Anh|Thủy|Thùy/i }).toArray();
  console.log('Places with "Anh" or "Thủy" or "Thùy" (Count: ' + places.length + '):');
  places.forEach(p => {
    console.log(` - name: "${p.name}" | kind: "${p.kind}" | ownerId: "${p.ownerId}" | region: "${p.region}"`);
  });
  mongoose.connection.close();
}).catch(console.error);
