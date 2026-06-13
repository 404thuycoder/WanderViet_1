require('dotenv').config();
const mongoose = require('mongoose');
const Place = require('../server/models/Place');

const MONGODB_URI = (process.env.MONGODB_URI || '').trim();

if (!MONGODB_URI) {
  console.error('No MONGODB_URI found in .env');
  process.exit(1);
}

// Fallback Unsplash images
const placeholders = {
  stay: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80',
  dining: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&q=80',
  tour: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=1000&q=80',
  rental: 'https://images.unsplash.com/photo-1555431189-d58b1740006d?w=1000&q=80',
  general: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&q=80'
};

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  });
  console.log('Connected to MongoDB.');

  const places = await Place.find({});
  console.log(`Found ${places.length} places in database.`);

  let updatedCount = 0;
  for (const place of places) {
    let changed = false;

    // Check kind/category to choose appropriate fallback
    let fallback = placeholders.general;
    if (place.kind === 'khach-san' || place.businessCategory === 'stay') {
      fallback = placeholders.stay;
    } else if (place.kind === 'nha-hang' || place.businessCategory === 'dining') {
      fallback = placeholders.dining;
    } else if (place.isTour || place.kind === 'tour' || place.businessCategory === 'tour') {
      fallback = placeholders.tour;
    } else if (place.kind === 'thue-xe' || place.businessCategory === 'rental') {
      fallback = placeholders.rental;
    }

    const isBroken = (url) => {
      if (!url) return false;
      return url.includes('dailyxedien.vn') || url.includes('dulichmocchau.net') || url.includes('cattour.vn');
    };

    if (isBroken(place.image)) {
      console.log(`Fixing image for place: ${place.name} (${place._id})`);
      place.image = fallback;
      changed = true;
    }

    if (place.images && place.images.length > 0) {
      const newImages = place.images.map(img => isBroken(img) ? fallback : img);
      if (JSON.stringify(newImages) !== JSON.stringify(place.images)) {
        console.log(`Fixing images array for place: ${place.name} (${place._id})`);
        place.images = newImages;
        changed = true;
      }
    }

    // Check nested diningPlaces, accommodations, checkInSpots, amusementPlaces
    const checkNested = (array) => {
      if (!array || !Array.isArray(array)) return;
      array.forEach(item => {
        if (isBroken(item.image)) {
          console.log(`Fixing nested image in ${place.name} for item: ${item.name}`);
          item.image = fallback;
          changed = true;
        }
      });
    };

    checkNested(place.diningPlaces);
    checkNested(place.accommodations);
    checkNested(place.checkInSpots);
    checkNested(place.amusementPlaces);

    if (changed) {
      await place.save();
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} places in database.`);
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error('Error running update script:', err);
  process.exit(1);
});
