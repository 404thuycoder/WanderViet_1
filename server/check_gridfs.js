const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkGridFS() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const { WanderFileStorage } = require('./utils/gridfsStorage');
    const file = await WanderFileStorage.findOne({ filename: 'review_1778940311349_7qocbproj0d.jpg' });

    if (file) {
      console.log(`Found file in GridFS! ID: ${file._id}`);
      console.log(`Suggested URL: /api/files/${file._id}`);
    } else {
      console.log('File NOT found in GridFS.');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkGridFS();
