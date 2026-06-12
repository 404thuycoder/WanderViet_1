const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../server/models/User');
const Itinerary = require('../server/models/Itinerary');
const Conversation = require('../server/models/Conversation');
const Friendship = require('../server/models/Friendship');
const Post = require('../server/models/Post');

async function checkData() {
  await mongoose.connect(process.env.MONGODB_URI.trim());
  console.log('Connected to DB');

  const usersCount = await User.countDocuments();
  console.log('Total users:', usersCount);

  const users = await User.find().limit(5);
  users.forEach(u => {
    console.log(`User: ${u.name} | ${u.email} | Points: ${u.points} | Rank: ${u.rank} ${u.rankTier}`);
  });

  const itinerariesCount = await Itinerary.countDocuments();
  console.log('Total itineraries:', itinerariesCount);

  const postsCount = await Post.countDocuments();
  console.log('Total posts:', postsCount);

  const convCount = await Conversation.countDocuments();
  console.log('Total conversations:', convCount);

  await mongoose.disconnect();
}

checkData().catch(console.error);
