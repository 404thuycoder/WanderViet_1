require('dotenv').config();
const mongoose = require('mongoose');
const Place = require('../server/models/Place');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected.');
    
    const places = await Place.find({}).select('id name image images top').lean();
    console.log(`Total places: ${places.length}`);
    
    const brokenPlaces = places.filter(p => {
      const isBadImg = !p.image || p.image.includes('undefined') || p.image.includes('null') || p.image === '';
      const isBadImages = p.images && p.images.some(img => !img || img.includes('undefined') || img.includes('null') || img === '');
      return isBadImg || isBadImages;
    });
    
    console.log('\nPlaces with potentially broken or empty images:');
    brokenPlaces.forEach(p => {
      console.log(`- ID: ${p.id}, Name: ${p.name}, Top: ${p.top}`);
      console.log(`  image:  ${JSON.stringify(p.image)}`);
      console.log(`  images: ${JSON.stringify(p.images)}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

inspect();
