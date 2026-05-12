const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI.trim());
    console.log('Connected to MongoDB');
    
    const email = 'buit21062006@gmail.com';
    const user = await User.findOne({ email: email });
    
    if (user) {
      console.log('User found:', user.name);
      console.log('Email:', user.email);
      console.log('Preferences:', JSON.stringify(user.preferences, null, 2));
    } else {
      console.log('User not found with email:', email);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkUser();
