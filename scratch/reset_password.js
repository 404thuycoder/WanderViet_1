const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const BusinessAccount = require('../server/models/BusinessAccount');
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password@2006', salt);

  console.log('Restoring password to password@2006 for halong@luxury.com...');
  const result = await BusinessAccount.updateMany(
    { email: 'halong@luxury.com' },
    { $set: { password: hashedPassword } }
  );
  
  console.log('Updated accounts count:', result.modifiedCount);
  await mongoose.disconnect();
}

run().catch(console.error);
