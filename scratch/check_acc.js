require('dotenv').config();
const mongoose = require('mongoose');
const BusinessAccount = require('../server/models/BusinessAccount');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI.trim());
    const acc = await BusinessAccount.findOne({ email: 'muongthanh@gmail.com' });
    if (acc) {
      console.log('Account found:', acc.email, acc.status, acc.role);
      console.log('ID:', acc._id);
      console.log('customId:', acc.customId);
    } else {
      console.log('Account NOT found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
