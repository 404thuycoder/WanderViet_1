/**
 * Fix Hero Images: Update Đà Lạt and Côn Đảo image URLs in MongoDB
 * Run: node fix_hero_images.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/wanderviet';

const updates = [
  {
    // Đà Lạt - link cũ bị lỗi (fansipan), thay bằng link đà lạt đúng
    filter: { $or: [{ id: 'da-lat' }, { name: /Đà Lạt/i }] },
    image: 'https://booking.muongthanh.com/upload_images/images/H%60/thanh-pho-da-lat.jpg',
    label: 'Đà Lạt'
  },
  {
    // Côn Đảo - link cũ trỏ tới ảnh Phong Nha, thay bằng link đúng
    filter: { $or: [{ id: 'con-dao' }, { name: /Côn Đảo/i }] },
    image: 'https://images.hcmcpv.org.vn/res/news/2025/10/19-10-2025-vuon-quoc-gia-con-dao-trung-tam-da-dang-sinh-hoc-giau-gia-tri-A6109B0E.jpg',
    label: 'Côn Đảo'
  }
];

async function main() {
  console.log('🔌 Connecting to MongoDB:', MONGO_URI.replace(/\/\/.*@/, '//***@'));
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected!\n');

  const Place = mongoose.model('Place', new mongoose.Schema({}, { strict: false }), 'places');

  for (const u of updates) {
    const before = await Place.findOne(u.filter).lean();
    if (!before) {
      console.log(`⚠️  Không tìm thấy địa điểm: ${u.label}`);
      continue;
    }
    console.log(`📍 ${u.label}`);
    console.log(`   Ảnh cũ: ${before.image}`);
    const result = await Place.updateOne(u.filter, { $set: { image: u.image } });
    console.log(`   Ảnh mới: ${u.image}`);
    console.log(`   Đã cập nhật: ${result.modifiedCount} document\n`);
  }

  await mongoose.disconnect();
  console.log('🎉 Hoàn tất! Hãy xoá sessionStorage trên trình duyệt (F12 > Application > Session Storage > Clear All) để thấy ảnh mới.');
}

main().catch(err => { console.error('❌ Lỗi:', err.message); process.exit(1); });
