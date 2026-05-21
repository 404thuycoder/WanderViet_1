require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fetch = global.fetch || require('node-fetch');

(async () => {
  try {
    const MONGO = process.env.MONGODB_URI;
    if (!MONGO) throw new Error('MONGODB_URI not set in .env');
    await mongoose.connect(MONGO);
    const User = require('../server/models/User');
    const user = await User.findOne({ status: 'active' }).lean();
    if (!user) throw new Error('No active user found in DB');
      const Place = require('../server/models/Place');
      const place = await Place.findOne({}).lean();
      if (!place) throw new Error('No place found in DB');
    const JWT_SECRET = (process.env.JWT_SECRET || 'wander-viet-secret-key-123').trim();
    const account = {
      id: user.customId || user.id || (user._id && user._id.toString()) || null,
      _id: user._id && user._id.toString(),
      customId: user.customId || user.id,
      email: user.email,
      name: user.name || user.displayName || 'Dev',
      displayName: user.displayName || user.name || 'Dev',
      role: 'user',
      status: user.status || 'active',
      portal: 'user'
    };
    const token = jwt.sign(account, JWT_SECRET, { expiresIn: '7d' });

    const body = {
      placeId: process.env.DEBUG_PLACE_ID || (place.id || place._id && place._id.toString()),
      customerName: 'PostByDebugScript',
      customerPhone: '0123456789',
      useDate: new Date().toISOString(),
      paymentMethod: 'contact',
      voucherCode: process.env.DEBUG_VOUCHER || null,
      totalPrice: 123000
    };

    const res = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    const j = await res.json();
    console.log('Status:', res.status, 'Response:', j);
    process.exit(0);
  } catch (err) {
    console.error('Error in debug_post_booking:', err.message || err);
    process.exit(2);
  }
})();
