require('dotenv').config();
const mongoose = require('mongoose');
const Place = require('../models/Place');
const User = require('../models/User');

mongoose.connect(process.env.MONGODB_URI.trim()).then(async () => {
  const placeId = '69fed77fb5310f95e5619b4c';
  
  // Test 1: Find place
  const place = await Place.findById(placeId);
  console.log('Place found:', place ? place.name : 'NOT FOUND');
  if (place) {
    console.log('favoritesCount:', place.favoritesCount);
    console.log('ownerId:', place.ownerId);
  }
  
  // Test 2: Find a user
  const user = await User.findOne({ role: 'user' });
  console.log('User found:', user ? user.name : 'NOT FOUND');
  if (user) {
    console.log('favorites array:', user.favorites);
  }
  
  // Test 3: Simulate the toggle
  if (place && user) {
    const placeIdToSave = place.id || place._id.toString();
    console.log('placeIdToSave:', placeIdToSave);
    const isFavorited = user.favorites && user.favorites.includes(placeIdToSave);
    console.log('isFavorited:', isFavorited);
    
    if (!isFavorited) {
      if (!user.favorites) user.favorites = [];
      user.favorites.push(placeIdToSave);
      place.favoritesCount = (place.favoritesCount || 0) + 1;
    } else {
      user.favorites = user.favorites.filter(f => f !== placeIdToSave);
      place.favoritesCount = Math.max(0, (place.favoritesCount || 0) - 1);
    }
    
    try {
      await Promise.all([user.save(), place.save()]);
      console.log('Save SUCCESS. isFavorited now:', !isFavorited);
    } catch (err) {
      console.error('Save ERROR:', err.message);
    }
  }
  
  process.exit(0);
});
