const mongoose = require('mongoose');
const BusinessAccount = require('./server/models/BusinessAccount');
const Place = require('./server/models/Place');

mongoose.connect('mongodb://localhost:27017/wanderviet').then(async () => {
    const biz = await BusinessAccount.find();
    console.log("Businesses:", biz.map(b => b.customId || b.id || b._id));
    
    const places = await Place.find();
    console.log("Places:", places.map(p => p.id || p._id));
    
    process.exit(0);
});
