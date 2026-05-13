const mongoose = require('mongoose');
const BusinessActivity = require('../server/models/BusinessActivity');
const Place = require('../server/models/Place');
require('dotenv').config();

async function testActivities() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wanderviet');
    console.log('Connected');

    const activities = await BusinessActivity.find({}).limit(5);
    console.log('Activities found:', activities.length);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testActivities();
