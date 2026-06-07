const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in .env file');
  }
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Connected to DB');

  const User = require('../server/models/User');
  const BusinessAccount = require('../server/models/BusinessAccount');
  const AdminAccount = require('../server/models/AdminAccount');
  
  console.log('--- Searching by username/email ---');
  const biz1 = await BusinessAccount.find({
    $or: [
      { email: 'halong@luxury.com' },
      { username: 'business18017811' },
      { customId: 'business18017811' }
    ]
  });
  console.log('BusinessAccounts found:', JSON.stringify(biz1, null, 2));

  const users1 = await User.find({
    $or: [
      { email: 'halong@luxury.com' },
      { username: 'business18017811' }
    ]
  });
  console.log('Users found:', JSON.stringify(users1, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
