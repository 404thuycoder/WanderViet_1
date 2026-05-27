const mongoose = require('mongoose');
require('dotenv').config();

const Place = require('../server/models/Place');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const names = ['Hà Nội', 'Tuyên Quang', 'Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hạ Long', 'Vịnh Hạ Long'];
  for (const name of names) {
    const places = await Place.find({ name: new RegExp(name, 'i') }).select('id name kind image images gallery');
    console.log(`\nQuery: ${name}`);
    if (places.length === 0) {
      console.log('No places found');
    } else {
      places.forEach(p => {
        console.log(`- ID: ${p.id}, _id: ${p._id}, Name: ${p.name}, Kind: ${p.kind}`);
        console.log(`  Image: ${p.image}`);
        console.log(`  Images:`, p.images);
        console.log(`  Gallery:`, p.gallery);
      });
    }
  }

  await mongoose.disconnect();
}

check().catch(console.error);
