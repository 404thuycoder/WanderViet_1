const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../../server/models/User');
const BusinessAccount = require('../../server/models/BusinessAccount');
const Itinerary = require('../../server/models/Itinerary');

async function run() {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to URI:', uri ? uri.substring(0, 40) + '...' : 'undefined');
  await mongoose.connect(uri);
  console.log('Connected to DB');
  const userCount = await User.countDocuments();
  const bizCount = await BusinessAccount.countDocuments();
  const itinCount = await Itinerary.countDocuments();
  console.log('Users count:', userCount);
  console.log('Biz count:', bizCount);
  console.log('Itineraries count:', itinCount);
  
  const sampleUsers = await User.find().limit(5).select('email role createdAt isBusiness');
  console.log('Sample users:', sampleUsers);
  
  const sampleBiz = await BusinessAccount.find().limit(5).select('name email createdAt');
  console.log('Sample biz:', sampleBiz);

  mongoose.connection.close();
}

run().catch(console.error);
