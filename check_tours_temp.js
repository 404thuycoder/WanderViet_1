const mongoose = require('mongoose');
const path = require('path');
// Load env from the project root
require('dotenv').config();

const Place = require('./server/models/Place');

async function checkTours() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wanderviet';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const tourCount = await Place.countDocuments({ isTour: true });
    console.log(`Total Tours found: ${tourCount}`);

    const tours = await Place.find({ isTour: true }).lean();
    console.log(`Total Tours found: ${tours.length}`);
    tours.forEach(t => {
      console.log(`- ${t.name} (ID: ${t._id}) | ownerId: ${t.ownerId} | status: ${t.status}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkTours();
