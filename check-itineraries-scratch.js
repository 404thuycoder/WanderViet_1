const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wanderviet';
console.log('Connecting to', mongoUri);

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected!');
    const Itinerary = mongoose.model('Itinerary', new mongoose.Schema({
      destination: String,
      days: Number,
      budget: String,
      planJson: Object,
      isDraft: Boolean
    }, { collection: 'itineraries' }));

    const count = await Itinerary.countDocuments();
    console.log('Total itineraries:', count);

    const latestList = await Itinerary.find().sort({ _id: -1 }).limit(3).lean();
    latestList.forEach((latest, idx) => {
      console.log(`\n=== ITINERARY ${idx+1} ===`);
      console.log('ID:', latest._id);
      console.log('Destination:', latest.destination);
      console.log('Days:', latest.days);
      console.log('Budget:', latest.budget);
      console.log('isDraft:', latest.isDraft);
      if (latest.planJson) {
        console.log('planJson keys:', Object.keys(latest.planJson));
        console.log('planJson itinerary length:', latest.planJson.itinerary ? latest.planJson.itinerary.length : 'no itinerary');
        if (latest.planJson.itinerary && latest.planJson.itinerary.length > 0) {
          console.log('planJson itinerary[0] day:', latest.planJson.itinerary[0].day);
          console.log('planJson itinerary[0] activities length:', latest.planJson.itinerary[0].activities ? latest.planJson.itinerary[0].activities.length : 'no activities');
        }
      } else {
        console.log('planJson: missing/null');
      }
    });

    await mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
  });
