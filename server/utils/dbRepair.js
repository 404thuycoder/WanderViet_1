const mongoose = require('mongoose');

const TARGET = "02jita874deo1701229183245";
const TUYEN_QUANG_IMAGE = "https://vcdn1-dulich.vnecdn.net/2023/12/28/nahang4-1703754248-1703754258-3629-1703758253.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=s2XbmocQKHKJ10fyFgRQrQ";
const GENERAL_IMAGE = "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80";

function performReplace(value, doc) {
  if (typeof value !== 'string') return value;
  if (!value.includes(TARGET)) return value;
  
  let replacement = GENERAL_IMAGE;
  const docString = JSON.stringify(doc).toLowerCase();
  if (docString.includes("tuyên quang") || docString.includes("tuyen quang") || docString.includes("na hang") || docString.includes("nahang")) {
    replacement = TUYEN_QUANG_IMAGE;
  }
  
  if (value.endsWith(TARGET + '.jpg') || value === TARGET || value === 'uploads/' + TARGET || value.includes('uploads/' + TARGET)) {
    return replacement;
  }
  
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
  if (!uri) return;
  const cleanUri = uri.trim();
  let conn;
  try {
    conn = await mongoose.createConnection(cleanUri).asPromise();
  } catch (err) {
    console.error(`[DB Repair] Connection failed for ${dbName}:`, err.message);
    return;
  }

  const db = conn.db;
  const collections = await db.listCollections().toArray();
  let fixCount = 0;

  for (const collInfo of collections) {
    const collName = collInfo.name;
    const collection = db.collection(collName);

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
        for (const doc of docs) {
          const originalDoc = JSON.parse(JSON.stringify(doc));
          const res = processObject(doc, originalDoc);
          if (res.changed) {
            await collection.replaceOne({ _id: doc._id }, doc);
            console.log(`[DB Repair] Fixed document ${doc._id} in ${dbName}.${collName}`);
            fixCount++;
          }
        }
      }
    } catch (err) {
      // Ignore
    }
  }

  if (fixCount > 0) {
    console.log(`[DB Repair] Finished ${dbName}: fixed ${fixCount} documents.`);
  }
  try {
    await conn.close();
  } catch (closeErr) {
    // Ignore
  }
}

async function runDbRepair() {
  console.log('[DB Repair] Checking databases for broken image references on startup...');
  await fixInDb(process.env.MONGODB_URI, 'Main DB');
  await fixInDb(process.env.CHATBOT_MONGODB_URI, 'Chatbot DB');
  await fixInDb(process.env.PLANNER_MONGODB_URI, 'Planner DB');
}

module.exports = { runDbRepair };
