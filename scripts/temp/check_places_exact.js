require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const places = await db.collection('places').find({ name: /Anh Thủy|Thủy Phi Cơ|Sun World|Luxury Dinner|Câu Mực|Spa & Massage/i }).toArray();
  console.log('Matching places in places collection (Count: ' + places.length + '):');
  places.forEach(p => {
    console.log(` - name: ${p.name} | kind: ${p.kind} | ownerId: ${p.ownerId} | price: ${p.price || p.priceFrom} | status: ${p.status}`);
  });
  mongoose.connection.close();
}).catch(console.error);
