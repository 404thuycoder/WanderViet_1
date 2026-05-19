const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Booking = require(path.join(__dirname, '../server/models/Booking'));
  
  // Xem tất cả bookings của user, field businessCategory
  const bs = await Booking.find({}, 'placeName placeId businessCategory').sort({ createdAt: -1 }).limit(15);
  bs.forEach(b => console.log(`[${b.businessCategory}] ${b.placeName} | placeId: ${b.placeId}`));
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
