const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const BusinessAccount = require('../server/models/BusinessAccount');

  console.log('Changing email for customId business43113762 to halong@gmail.com...');
  const result = await BusinessAccount.updateOne(
    { customId: 'business43113762' },
    { $set: { email: 'halong@gmail.com' } }
  );
  
  console.log('Updated accounts count:', result.modifiedCount);
  await mongoose.disconnect();
}

run().catch(console.error);
