const mongoose = require('mongoose');
require('dotenv').config();

const TARGET = "02jita874deo1701229183245";
const TUYEN_QUANG_IMAGE = "https://vcdn1-dulich.vnecdn.net/2023/12/28/nahang4-1703754248-1703754258-3629-1703758253.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=s2XbmocQKHKJ10fyFgRQrQ";
const GENERAL_IMAGE = "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80";

function performReplace(value, doc) {
  if (typeof value !== 'string') return value;
  if (!value.includes(TARGET)) return value;
  
  // Decide replacement based on context
  let replacement = GENERAL_IMAGE;
  const docString = JSON.stringify(doc).toLowerCase();
  if (docString.includes("tuyên quang") || docString.includes("tuyen quang") || docString.includes("na hang") || docString.includes("nahang")) {
    replacement = TUYEN_QUANG_IMAGE;
  }
  
  console.log(`    Found reference in: "${value}". Replacing with: "${replacement.substring(0, 60)}..."`);
  
  if (value.endsWith(TARGET + '.jpg') || value === TARGET || value === 'uploads/' + TARGET || value.includes('uploads/' + TARGET)) {
    return replacement;
  }
  
  // Replace all occurrences in substring format (e.g. if in JSON serialized format)
  return value.replace(new RegExp(`(/)?(uploads/)?${TARGET}(\\.jpg)?`, 'g'), replacement);
}

function processObject(obj, doc) {
  if (!obj) return { changed: false, value: obj };
  let changed = false;
  
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string' && obj[i].includes(TARGET)) {
        obj[i] = performReplace(obj[i], doc);
        changed = true;
      } else if (typeof obj[i] === 'object' && obj[i] !== null) {
        const res = processObject(obj[i], doc);
        if (res.changed) {
          obj[i] = res.value;
          changed = true;
        }
      }
    }
  } else if (typeof obj === 'object') {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'string' && obj[key].includes(TARGET)) {
          obj[key] = performReplace(obj[key], doc);
          changed = true;
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          const res = processObject(obj[key], doc);
          if (res.changed) {
            obj[key] = res.value;
            changed = true;
          }
        }
      }
    }
  }
  return { changed, value: obj };
}

async function fixInDb(uri, dbName) {
  if (!uri) {
    console.log(`⚠️ No URI specified for ${dbName}. Skipping.\n`);
    return;
  }
  const cleanUri = uri.trim();
  console.log(`🔌 Connecting to ${dbName}...`);
  let conn;
  try {
    conn = await mongoose.createConnection(cleanUri).asPromise();
    console.log(`✅ Connected to ${dbName}!`);
  } catch (err) {
    console.error(`❌ Connection failed for ${dbName}:`, err.message);
    return;
  }

  const db = conn.db;
  const collections = await db.listCollections().toArray();
  let fixCount = 0;

  for (const collInfo of collections) {
    const collName = collInfo.name;
    const collection = db.collection(collName);

    // Dynamic search query matching any potential target field
    const query = {
      $or: [
        { image: new RegExp(TARGET, 'i') },
        { images: new RegExp(TARGET, 'i') },
        { avatar: new RegExp(TARGET, 'i') },
        { media: new RegExp(TARGET, 'i') },
        { mediaUrl: new RegExp(TARGET, 'i') },
        { text: new RegExp(TARGET, 'i') },
        { content: new RegExp(TARGET, 'i') },
        { planJson: new RegExp(TARGET, 'i') }
      ]
    };

    try {
      const docs = await collection.find(query).toArray();
      if (docs.length > 0) {
        console.log(`🔍 Found ${docs.length} candidate documents in "${collName}"`);
        for (const doc of docs) {
          const originalDoc = JSON.parse(JSON.stringify(doc));
          const res = processObject(doc, originalDoc);
          if (res.changed) {
            await collection.replaceOne({ _id: doc._id }, doc);
            console.log(`✨ Successfully updated document ${doc._id} in "${collName}"`);
            fixCount++;
          }
        }
      }
    } catch (err) {
      // Ignore system collections
    }
  }

  console.log(`🏁 Completed database "${dbName}": fixed ${fixCount} documents.\n`);
  try {
    await conn.close();
  } catch (closeErr) {
    // Ignore
  }
}

async function run() {
  console.log('🚀 Starting DB search and repair operation...\n');
  await fixInDb(process.env.MONGODB_URI, 'Main DB (wanderviet)');
  await fixInDb(process.env.CHATBOT_MONGODB_URI, 'Chatbot DB (wanderviet_chatbot)');
  await fixInDb(process.env.PLANNER_MONGODB_URI, 'Planner DB (wanderviet_planner)');
  console.log('🎉 Database repair completed successfully!');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
