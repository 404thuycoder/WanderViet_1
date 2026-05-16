const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkFaq() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Place = require('./models/Place');
    const placeId = '69f6e9d382d104bcf3474fd2';
    const faqId = '6a084a057e60272f3ce3a97c';

    const place = await Place.findById(placeId);
    if (!place) {
      console.log('Place not found by findById');
    } else {
      console.log(`Place found! Name: ${place.name}`);
      console.log(`Total FAQs: ${place.faqs ? place.faqs.length : 0}`);
      
      if (place.faqs) {
        place.faqs.forEach(f => console.log(`- FAQ ID: ${f._id}, Question: ${f.question}`));
      }
      
      const faq = place.faqs.id(faqId);
      if (faq) {
        console.log(`FAQ found via .id(): ${faq.question}`);
      } else {
        console.log(`FAQ NOT found via .id('${faqId}')`);
        // Try manual find
        const manualFaq = place.faqs.find(f => f._id.toString() === faqId || f.id === faqId);
        if (manualFaq) {
          console.log(`FAQ found manually! ID matches.`);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkFaq();
