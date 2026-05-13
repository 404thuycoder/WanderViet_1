const mongoose = require('mongoose');
const BusinessActivity = require('../server/models/BusinessActivity');
const BusinessAccount = require('../server/models/BusinessAccount');
const Place = require('../server/models/Place');
require('dotenv').config();

async function seedActivities() {
  try {
    await mongoose.connect(process.env.MONGODB_URI.trim());
    console.log('Connected to DB');

    const businesses = await BusinessAccount.find({});
    if (businesses.length === 0) {
      console.log('No business accounts found');
      process.exit(0);
    }

    console.log(`Found ${businesses.length} businesses. Seeding...`);

    for (const biz of businesses) {
      // Find a place owned by this biz
      const place = await Place.findOne({ ownerId: biz.customId || biz.id || biz._id.toString() });
      if (!place) continue;

      const ownerId = biz.customId || biz.id || biz._id.toString();
      const placeId = place._id.toString();
      const businessCategory = place.businessCategory || 'other';

      const activities = [
        {
          placeId, placeName: place.name, businessCategory, ownerId, type: 'check_in', userName: 'Nguyễn Văn A',
          details: { message: 'Đã check-in tại quầy' }
        },
        {
          placeId, placeName: place.name, businessCategory, ownerId, type: 'check_in', userName: 'Trần Thị B',
          details: { message: 'Check-in qua QR Code' }
        },
        {
          placeId, placeName: place.name, businessCategory, ownerId, type: 'view_menu', userName: 'Khách vãng lai #12',
          details: { menuName: 'Thực đơn mùa hè' }
        },
        {
          placeId, placeName: place.name, businessCategory, ownerId, type: 'wifi_connect', userName: 'Lê Văn C',
          details: { device: 'iPhone 15 Pro' }
        },
        {
          placeId, placeName: place.name, businessCategory, ownerId, type: 'help_request', userName: 'Hoàng Anh',
          details: { subject: 'Cần hỗ trợ thanh toán', text: 'Tôi không quét được mã QR thanh toán tại bàn 5.' }
        },
        {
          placeId, placeName: place.name, businessCategory, ownerId, type: 'review', userName: 'Minh Tuấn',
          details: { rating: 5, comment: 'Dịch vụ tuyệt vời, nhân viên rất nhiệt tình!' }
        }
      ];

      // Add a bit of randomness to createdAt
      for (const act of activities) {
        const randomMinutes = Math.floor(Math.random() * 60);
        act.createdAt = new Date(Date.now() - randomMinutes * 60000);
      }

      await BusinessActivity.insertMany(activities);
      console.log(`Seeded activities for ${biz.name} (${place.name})`);
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
}

seedActivities();
