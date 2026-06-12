const mongoose = require('mongoose');
const User = require('../server/models/User');

mongoose.connect('mongodb://localhost:27017/wanderviet').then(async () => {
    const users = await User.find({}).limit(5).select('email displayName password favorites');
    console.log("Users:", JSON.stringify(users, null, 2));
    process.exit(0);
});
