const mongoose = require('mongoose');
require('dotenv').config();

async function searchInDb(uri, dbName) {
  if (!uri) {
    console.log(`⚠️ No URI specified for ${dbName}. Skipping.\n`);
    return;
  }
  
  // Clean URI to avoid hidden carriage returns
  const cleanUri = uri.trim();
  console.log(`🔌 Connecting to MongoDB ${dbName} at:`, cleanUri.substring(0, 60) + '...');
  
  let conn;
  try {
    conn = await mongoose.createConnection(cleanUri).asPromise();
    console.log(`✅ Connected to ${dbName}!`);
  } catch (connectErr) {
    console.error(`❌ Failed to connect to ${dbName}:`, connectErr.message);
    return;
  }

  const target = "02jita874deo1701229183245";
  console.log(`🔍 Searching ${dbName} collections for keyword: "${target}"...\n`);

  const db = conn.db;
  const collections = await db.listCollections().toArray();

  let foundCount = 0;

  for (const collInfo of collections) {
    const collName = collInfo.name;
    const collection = db.collection(collName);
    
    // Search all potential fields including inside objects or arrays
    const query = {
      $or: [
        { image: new RegExp(target, 'i') },
        { images: new RegExp(target, 'i') },
        { avatar: new RegExp(target, 'i') },
        { media: new RegExp(target, 'i') },
        { mediaUrl: new RegExp(target, 'i') },
        { text: new RegExp(target, 'i') },
        { content: new RegExp(target, 'i') },
        { planJson: new RegExp(target, 'i') }
      ]
    };

    try {
      const results = await collection.find(query).toArray();
      if (results.length > 0) {
        console.log(`⭐ Found ${results.length} matches in database "${dbName}", collection: "${collName}"`);
        results.forEach(doc => {
          console.log(`  - Document ID: ${doc._id}`);
          if (doc.name) console.log(`    Name: ${doc.name}`);
          if (doc.title) console.log(`    Title: ${doc.title}`);
          if (doc.image) console.log(`    Image: ${doc.image}`);
          if (doc.images) console.log(`    Images: ${JSON.stringify(doc.images)}`);
          if (doc.avatar) console.log(`    Avatar: ${doc.avatar}`);
          if (doc.media) console.log(`    Media: ${JSON.stringify(doc.media)}`);
          if (doc.mediaUrl) console.log(`    MediaUrl: ${doc.mediaUrl}`);
        });
        foundCount += results.length;
      }
    } catch (err) {
      // Ignore errors for system collections or search issues
    }
  }

  if (foundCount === 0) {
    console.log(`❌ No matches found in database ${dbName}.\n`);
  } else {
    console.log(`\n🎉 Completed search in ${dbName}, found ${foundCount} total matches!\n`);
  }

  try {
    await conn.close();
  } catch (closeErr) {
    // Ignore
  }
}

async function check() {
  await searchInDb(process.env.MONGODB_URI, 'Main DB (wanderviet)');
  await searchInDb(process.env.CHATBOT_MONGODB_URI, 'Chatbot DB (wanderviet_chatbot)');
  await searchInDb(process.env.PLANNER_MONGODB_URI, 'Planner DB (wanderviet_planner)');
  console.log('🏁 All searches complete.');
  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
