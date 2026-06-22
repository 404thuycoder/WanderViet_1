require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  try {
    // 1. Connect to main MONGODB_URI
    console.log('Connecting to Main DB:', process.env.MONGODB_URI);
    const mainConn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Main DB');
    
    // Check in Itinerary collection on main connection
    const Itinerary = mongoose.model('Itinerary', new mongoose.Schema({}, { strict: false }));
    const mainItin = await Itinerary.findById('6a38506a8560b283e0e36cad');
    console.log('Main DB Itinerary:', mainItin);

    // 2. Connect to Chatbot DB
    console.log('Connecting to Chatbot DB:', process.env.CHATBOT_MONGODB_URI);
    const chatbotDb = mongoose.createConnection(process.env.CHATBOT_MONGODB_URI);
    await new Promise((resolve) => chatbotDb.once('open', resolve));
    console.log('Connected to Chatbot DB');

    const ChatbotItinerary = chatbotDb.model('Itinerary', new mongoose.Schema({}, { strict: false }), 'itineraries');
    const cbItin = await ChatbotItinerary.findById('6a38506a8560b283e0e36cad');
    console.log('Chatbot DB Itinerary (itineraries):', cbItin);

    // Check other collections
    const collections = await chatbotDb.db.listCollections().toArray();
    console.log('Chatbot DB Collections:', collections.map(c => c.name));

    await mongoose.disconnect();
    await chatbotDb.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
