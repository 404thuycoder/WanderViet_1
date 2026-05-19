const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Booking = require(path.join(__dirname, '../server/models/Booking'));
  const Place = require(path.join(__dirname, '../server/models/Place'));

  // Lấy tất cả places có businessCategory=rental hoặc kind=thue-xe
  const rentalPlaces = await Place.find({
    $or: [{ businessCategory: 'rental' }, { kind: 'thue-xe' }]
  }, 'name id _id businessCategory kind');
  
  console.log('Rental places trong DB:');
  rentalPlaces.forEach(p => console.log(` - [${p.id || p._id}] ${p.name}`));
  
  // Tập hợp tất cả id string và _id của rental places
  const rentalIds = new Set();
  const rentalObjectIds = new Set();
  rentalPlaces.forEach(p => {
    if (p.id) rentalIds.add(p.id);
    rentalObjectIds.add(p._id.toString());
  });
  
  // Tìm bookings có placeId thuộc rental places nhưng businessCategory chưa phải rental
  const badBookings = await Booking.find({ businessCategory: { $ne: 'rental' } }, 'placeName placeId businessCategory');
  
  let updated = 0;
  for (const b of badBookings) {
    if (rentalIds.has(b.placeId) || rentalObjectIds.has(b.placeId)) {
      await Booking.findByIdAndUpdate(b._id, { businessCategory: 'rental' });
      console.log(`✓ Fixed: ${b.placeName} [${b.placeId}]`);
      updated++;
    }
  }
  
  console.log(`\nTotal fixed: ${updated} bookings`);
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
