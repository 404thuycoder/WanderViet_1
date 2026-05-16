const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkReviews() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const PlaceReview = require('./models/PlaceReview');
    const reviews = await PlaceReview.find().sort({ createdAt: -1 }).limit(5);

    console.log('Latest 5 reviews:');
    reviews.forEach(r => {
      console.log(`ID: ${r._id}, CreatedAt: ${r.createdAt}, Images: ${JSON.stringify(r.images)}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkReviews();
