require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  
  // Get Ha Long Luxury Hotel account with password
  const acc = await db.collection('businessaccounts').findOne({ email: 'halong@luxury.com' });
  if (!acc) { console.log('Account not found'); return; }
  
  console.log('Account:', acc.name);
  console.log('Password hash exists:', !!acc.password);
  console.log('Password hash:', acc.password ? acc.password.substring(0, 30) + '...' : 'NONE');
  
  // Test various passwords
  const testPasswords = ['password@2006', '123456', 'password', 'admin123', 'halong123'];
  for (const pw of testPasswords) {
    if (acc.password) {
      const match = await bcrypt.compare(pw, acc.password);
      if (match) console.log(`✅ Password match: "${pw}"`);
    }
  }
  
  // Reset password to password@2006 for all business accounts
  const newHash = await bcrypt.hash('password@2006', 10);
  const result = await db.collection('businessaccounts').updateMany(
    {},
    { $set: { password: newHash } }
  );
  console.log(`\n✅ Reset password to "password@2006" for ${result.modifiedCount} business accounts`);

  mongoose.connection.close();
}).catch(console.error);
