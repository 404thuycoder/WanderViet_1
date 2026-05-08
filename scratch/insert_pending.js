const mongoose = require('mongoose');
require('dotenv').config();
const Place = require('../models/Place');

async function insert() {
  await mongoose.connect(process.env.MONGODB_URI.trim());
  console.log('Connected to DB');

  const newPlace = new Place({
    id: 'test-pending-' + Date.now(),
    name: 'TEST PENDING PLACE',
    kind: 'diem-du-lich',
    status: 'pending',
    source: 'partner',
    ownerId: 'business52623887', // Mường Thanh Tuyên Quang
    region: 'Hà Nội'
  });

  await newPlace.save();
  console.log('Inserted pending place:', newPlace.name);

  process.exit(0);
}

insert();
