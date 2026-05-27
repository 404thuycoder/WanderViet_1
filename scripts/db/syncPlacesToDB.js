const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Place = require('../../server/models/Place');
const User = require('../../server/models/User');

async function sync() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Load places-data.js
    const placesDataPath = path.join(__dirname, '../../apps/user-web/js/places-data.js');
    console.log(`📖 Reading places-data from: ${placesDataPath}`);
    const content = fs.readFileSync(placesDataPath, 'utf-8');
    const arrayMatch = content.match(/window\.WANDER_PLACES\s*=\s*(\[[\s\S]*\]);/);
    if (!arrayMatch) {
      throw new Error('Could not find window.WANDER_PLACES in places-data.js');
    }

    const arrayStr = arrayMatch[1];
    const placesData = new Function('return ' + arrayStr)();
    console.log(`Loaded ${placesData.length} places from static file.`);

    for (const p of placesData) {
      const existing = await Place.findOne({ id: p.id });
      if (existing) {
        console.log(`🔄 Updating place in DB: ${p.name} (${p.id})`);
        existing.image = p.image;
        existing.images = p.images || [p.image];
        existing.text = p.text || existing.text;
        existing.meta = p.meta || existing.meta;
        existing.region = p.region || existing.region;
        existing.lat = p.lat !== undefined ? p.lat : existing.lat;
        existing.lng = p.lng !== undefined ? p.lng : existing.lng;
        existing.status = 'approved'; // Make sure it's approved to display publicly
        
        // Also update activities if needed
        if (p.activities) {
          existing.activities = p.activities;
        }
        await existing.save();
        console.log(`   ✅ Updated image to: ${p.image}`);
      } else {
        console.log(`➕ Creating new place in DB: ${p.name} (${p.id})`);
        const newPlace = new Place({
          id: p.id,
          name: p.name,
          region: p.region,
          tags: p.tags,
          budget: p.budget,
          pace: p.pace,
          habits: p.habits,
          interests: p.interests,
          meta: p.meta,
          text: p.text,
          image: p.image,
          images: p.images || [p.image],
          lat: p.lat,
          lng: p.lng,
          transportTips: p.transportTips,
          activities: p.activities,
          amusementPlaces: p.amusementPlaces,
          accommodations: p.accommodations,
          diningPlaces: p.diningPlaces,
          checkInSpots: p.checkInSpots,
          status: 'approved',
          source: 'system'
        });
        await newPlace.save();
        console.log(`   ✅ Created successfully.`);
      }
    }

    console.log('🎉 Synchronization completed successfully!');
  } catch (err) {
    console.error('❌ Error during sync:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

sync();
