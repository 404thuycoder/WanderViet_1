const mongoose = require('mongoose');

// Kết nối đến DB dành riêng cho Chatbot
const chatbotUri = (process.env.CHATBOT_MONGODB_URI || "").trim();

if (!chatbotUri) {
  // console.warn('⚠️  CHATBOT_MONGODB_URI is not defined in .env!');
}

const chatbotDb = mongoose.createConnection(chatbotUri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
});

chatbotDb.on('connected', () => {
  console.log('✅ Chatbot MongoDB connected');
});

chatbotDb.on('error', (err) => {
  if (err.message.includes('getaddrinfo') || err.message.includes('ENOTFOUND')) {
    // console.error('❌ Chatbot DB: Connection issue.');
  } else {
    console.error('❌ Chatbot DB error:', err.message);
  }
});

module.exports = chatbotDb;
