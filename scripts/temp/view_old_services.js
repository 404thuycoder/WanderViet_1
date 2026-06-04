require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const services = await db.collection('services').find().toArray();
  console.log('Services in old collection (Count: ' + services.length + '):');
  services.forEach(s => {
    console.log(` - name: ${s.name} | category: ${s.category} | ownerId: ${s.ownerId} | price: ${s.price}`);
  });
  mongoose.connection.close();
}).catch(console.error);
