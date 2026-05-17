const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const BusinessAccount = require('./server/models/BusinessAccount');

async function seedBusiness() {
    try {
        await mongoose.connect('mongodb://localhost:27017/wanderviet');
        console.log('Connected to DB');

        const customId = 'BIZ-001-HALONG';
        const existing = await BusinessAccount.findOne({ customId });
        
        if (existing) {
            console.log('Business already exists. Updating password...');
            const salt = await bcrypt.genSalt(10);
            existing.password = await bcrypt.hash('123456', salt);
            await existing.save();
            console.log('Password updated to: 123456');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);
            
            const biz = new BusinessAccount({
                customId: customId,
                name: 'Ha Long Luxury Hotel',
                displayName: 'Ha Long Luxury Hotel',
                email: 'contact@halongluxury.vn',
                password: hashedPassword,
                phone: '0901234567',
                status: 'active',
                isVerified: true,
                category: 'khach-san',
                bio: 'Tận hưởng kỳ nghỉ sang trọng tại Vịnh Hạ Long',
                address: 'Hạ Long, Quảng Ninh',
                followersCount: 0,
                ratingAvg: 5.0,
                reviewCount: 0
            });
            await biz.save();
            console.log('Created new BusinessAccount:', biz.name);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}

seedBusiness();
