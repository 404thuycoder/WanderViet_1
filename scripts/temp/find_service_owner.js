require('dotenv').config();
const mongoose = require('mongoose');

const ownerId = '69f9e209f9188cd08649bf95';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // Check in businessaccounts
  const biz = await db.collection('businessaccounts').findOne({ _id: new mongoose.Types.ObjectId(ownerId) });
  console.log('Business account:', biz ? JSON.stringify({ _id: biz._id, name: biz.name, customId: biz.customId }) : 'NOT FOUND');

  // Check in users
  const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(ownerId) });
  console.log('User:', user ? JSON.stringify({ _id: user._id, name: user.name, email: user.email, role: user.role }) : 'NOT FOUND');

  // Check in adminaccounts
  const admin = await db.collection('adminaccounts').findOne({ _id: new mongoose.Types.ObjectId(ownerId) });
  console.log('Admin account:', admin ? JSON.stringify({ _id: admin._id, name: admin.name }) : 'NOT FOUND');

  // Show all businessaccounts
  const allBiz = await db.collection('businessaccounts').find({}, { projection: { _id: 1, name: 1, customId: 1, status: 1 } }).toArray();
  console.log('\nAll business accounts:');
  allBiz.forEach(b => console.log(`  _id: ${b._id}, customId: ${b.customId}, name: ${b.name}`));

  mongoose.connection.close();
}).catch(console.error);
