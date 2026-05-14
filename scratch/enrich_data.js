const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Place = require('../server/models/Place');

async function enrichData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://toan_dev:21062006@ac-hqf0k07-shard-00-00.bwizvt3.mongodb.net:27017,ac-hqf0k07-shard-00-02.bwizvt3.mongodb.net:27017,ac-hqf0k07-shard-00-01.bwizvt3.mongodb.net:27017/wanderviet?ssl=true&authSource=admin&replicaSet=atlas-4kw7rc-shard-0&retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri.trim());
    console.log('Connected to MongoDB');

    // 1. Load static data
    const staticFilePath = path.join(__dirname, '../apps/user-web/js/places-data.js');
    const content = fs.readFileSync(staticFilePath, 'utf-8');
    const arrayMatch = content.match(/window\.WANDER_PLACES\s*=\s*(\[[\s\S]*\]);/);
    let staticPlaces = [];
    if (arrayMatch) {
      staticPlaces = new Function('return ' + arrayMatch[1])();
    }
    console.log(`Loaded ${staticPlaces.length} static places`);

    let updatedCount = 0;
    
    // 2. Sync static places to DB
    for (const sp of staticPlaces) {
      const slug = sp.id;
      const query = { $or: [{ id: sp.id }, { slug: slug }, { name: sp.name }] };
      const existing = await Place.findOne(query);
      
      if (existing) {
        // Update empty fields
        let changed = false;
        const fieldsToSync = [
          'description', 'overview', 'highlights', 'experience', 'address', 
          'openTime', 'closeTime', 'priceFrom', 'lat', 'lng', 'transportTips',
          'activities', 'amusementPlaces', 'accommodations', 'diningPlaces', 'checkInSpots'
        ];
        
        for (const field of fieldsToSync) {
          if ((!existing[field] || existing[field].length === 0) && sp[field]) {
            existing[field] = sp[field];
            changed = true;
          }
        }
        
        if (!existing.slug) {
          existing.slug = slug;
          changed = true;
        }

        if (changed) {
          await existing.save();
          updatedCount++;
        }
      } else {
        // Insert new
        const newP = new Place({
          ...sp,
          slug: sp.id,
          status: 'approved',
          source: 'system'
        });
        await newP.save();
        console.log(`Inserted missing static place: ${sp.name}`);
        updatedCount++;
      }
    }

    // 3. Fix business places (empty fields)
    const bizPlaces = await Place.find({ source: 'partner' });
    console.log(`Checking ${bizPlaces.length} partner places`);
    for (const bp of bizPlaces) {
      let changed = false;
      if (!bp.address || bp.address === '...') {
        bp.address = bp.region || 'Việt Nam';
        changed = true;
      }
      if (!bp.openTime || bp.openTime === '...') {
        bp.openTime = '08:00';
        bp.closeTime = '22:00';
        changed = true;
      }
      if (!bp.description || bp.description === '...') {
        bp.description = `Trải nghiệm đẳng cấp tại ${bp.name}. Dịch vụ được cung cấp bởi đối tác uy tín của WanderViệt.`;
        changed = true;
      }
      if (changed) {
        await bp.save();
        updatedCount++;
      }
    }

    console.log(`Finished. Updated/Inserted ${updatedCount} records.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

enrichData();
