const mongoose = require('mongoose');
const BusinessAccount = require('./server/models/BusinessAccount');
const Place = require('./server/models/Place');

async function test() {
    try {
        await mongoose.connect('mongodb://localhost:27017/wanderviet');
        console.log('Connected');

        const businessId = 'BIZ-001-HALONG';
        const conditions = [{ customId: businessId }];
        if (mongoose.Types.ObjectId.isValid(businessId)) conditions.push({ _id: businessId });
        const bQuery = { $or: conditions };

        console.log('bQuery:', bQuery);

        const bAcc = await BusinessAccount.findOneAndUpdate(bQuery, { $inc: { followersCount: 1 } });
        console.log('bAcc:', bAcc ? 'Found' : 'Not found');
        
    } catch (e) {
        console.error('Error during findOneAndUpdate:', e);
    } finally {
        mongoose.disconnect();
    }
}
test();
