require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const bizAccounts = await db.collection('businessaccounts').find({}).toArray();
  console.log('Business Accounts in database (Count: ' + bizAccounts.length + '):');
  bizAccounts.forEach(b => {
    console.log(` - name: ${b.name} | customId: ${b.customId} | email: ${b.email} | _id: ${b._id}`);
  });
  mongoose.connection.close();
}).catch(console.error);
