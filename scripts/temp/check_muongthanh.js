require('dotenv').config();
const mongoose = require('mongoose');
const BusinessAccount = require('../models/BusinessAccount');
const dbPlanner = require('../models/dbPlanner');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI.trim());
        const biz = await BusinessAccount.findOne({ email: 'muongthanh@gmail.com' });
        if (biz) {
            console.log('✅ Found business:', biz.email, 'Status:', biz.status, 'ID:', biz._id);
        } else {
            console.log('❌ Business not found');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
