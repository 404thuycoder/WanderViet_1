const mongoose = require('mongoose');
const Booking = require('../server/models/Booking');
const Place = require('../server/models/Place');
require('dotenv').config();

async function syncBookingCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI.trim());
    console.log('Connected to DB');

    const bookings = await Booking.find({});
    console.log(`Syncing ${bookings.length} bookings...`);

    for (const b of bookings) {
      const place = await Place.findOne({ $or: [{ _id: mongoose.isValidObjectId(b.placeId) ? b.placeId : null }, { id: b.placeId }] });
      if (place) {
        b.businessCategory = place.businessCategory || 'other';
        await b.save();
      }
    }

    console.log('Sync completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Sync Error:', err);
    process.exit(1);
  }
}

syncBookingCategories();
