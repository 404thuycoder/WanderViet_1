require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const BusinessAccount = require('../models/BusinessAccount');

async function reset() {
    try {
        await mongoose.connect(process.env.MONGODB_URI.trim());
        const password = 'Matkhaua123@';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const res = await BusinessAccount.updateOne(
            { email: 'muongthanh@gmail.com' },
            { $set: { password: hashedPassword, status: 'active' } }
        );
        console.log('✅ Updated password for muongthanh@gmail.com:', res);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
reset();
