const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const BusinessAccount = require('../server/models/BusinessAccount');
  const accounts = await BusinessAccount.find({});
  console.log(`Found ${accounts.length} business accounts.`);
  
  for (const acc of accounts) {
    const isPassword2006 = await bcrypt.compare('password@2006', acc.password);
    console.log(`Account: ${acc.displayName} (${acc.email}) - Matches 'password@2006'? ${isPassword2006} - Hash: ${acc.password}`);
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
