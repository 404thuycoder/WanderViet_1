// Script to check all places and their images
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const Place = require('./server/models/Place');
  const places = await Place.find({}).select('name kind image images gallery region city').lean();

  console.log(`\n=== TOTAL PLACES: ${places.length} ===\n`);

  for (const p of places) {
    const mainImg = p.image || '(none)';
    const imgCount = (p.images || []).length;
    const galleryCount = (p.gallery || []).length;
    
    // Check if image is likely broken
    const isBroken = !p.image || p.image === '' || p.image === 'undefined' || p.image === 'null';
    const isExternalUrl = p.image && (p.image.startsWith('http://') || p.image.startsWith('https://'));
    const isLocalFile = p.image && p.image.startsWith('/api/files/');
    
    const status = isBroken ? '❌ NO IMAGE' : (isExternalUrl ? '🌐 EXTERNAL' : (isLocalFile ? '📁 LOCAL' : '❓ UNKNOWN'));
    
    console.log(`${status} | ${p.kind} | ${p.name} (${p.region || 'no region'})`);
    console.log(`   Main: ${mainImg.substring(0, 100)}`);
    if (imgCount > 0) {
      console.log(`   Images[${imgCount}]: ${(p.images || []).map(i => i.substring(0, 80)).join('\n     ')}`);
    }
    if (galleryCount > 0) {
      console.log(`   Gallery[${galleryCount}]: ${(p.gallery || []).map(g => `[${g.category}] ${(g.url || '').substring(0, 80)}`).join('\n     ')}`);
    }
    console.log('---');
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
