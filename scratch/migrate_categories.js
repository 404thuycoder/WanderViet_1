const mongoose = require('mongoose');
require('dotenv').config();

async function migrateCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wanderviet');
    console.log('Connected to DB');

    const Place = mongoose.model('Place', new mongoose.Schema({}, { strict: false }));
    const places = await Place.find({});
    console.log(`Found ${places.length} places`);

    let updatedCount = 0;
    for (const p of places) {
      let cat = 'other';
      if (p.isTour || p.kind === 'trai-nghiem' || p.kind === 'diem-du-lich') cat = 'tour';
      else if (p.kind === 'khach-san') cat = 'stay';
      else if (p.kind === 'nha-hang') cat = 'dining';
      else if (p.kind === 'tien-ich') cat = 'facility';

      await Place.updateOne({ _id: p._id }, { $set: { businessCategory: cat } });
      updatedCount++;
    }

    console.log(`Successfully migrated ${updatedCount} places to new categories.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrateCategories();
