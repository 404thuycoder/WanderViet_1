const mongoose = require('mongoose');

// Kết nối đến DB dành riêng cho Travel Planner
const plannerUri = (process.env.PLANNER_MONGODB_URI || process.env.MONGODB_URI || "").trim();

if (!plannerUri) {
  // console.warn('⚠️  PLANNER_MONGODB_URI is not defined in .env!');
}

const plannerDb = mongoose.createConnection(plannerUri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
});

plannerDb.on('connected', () => {
  console.log('✅ Planner MongoDB connected');
});

plannerDb.on('error', (err) => {
  if (err.message.includes('getaddrinfo') || err.message.includes('ENOTFOUND')) {
    // console.error('❌ Planner DB: Connection issue.');
  } else {
    console.error('❌ Planner DB error:', err.message);
  }
});

module.exports = plannerDb;
