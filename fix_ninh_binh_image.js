/**
 * Fix Ninh Binh broken/split hero image in MongoDB
 * The old thumbnail is a collage (2 images side by side) which appears split when used as fullscreen background.
 * Replace with a clean single-scene Unsplash photo.
 * 
 * Run: node fix_ninh_binh_image.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wanderviet';

const GOOD_IMAGE = 'https://images.unsplash.com/photo-1571637539223-27c9cd20e2d5?w=1200&q=80';
const BAD_IMAGE_PATTERN = 'danh-lam-thang-canh-ninh-binh-thumbnail';

async function main() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected!\n');

  const Place = mongoose.model('Place', new mongoose.Schema({}, { strict: false }), 'places');

  const ninh = await Place.findOne({ $or: [{ id: 'ninh-binh' }, { name: /Ninh Bình/i }] }).lean();
  if (!ninh) {
    console.log('⚠️  Không tìm thấy địa điểm Ninh Bình');
    process.exit(1);
  }

  console.log('📍 Ninh Bình – ảnh hiện tại:');
  console.log('   image :', ninh.image);
  console.log('   images:', ninh.images);

  // Fix images array: remove the bad thumbnail, put good image first
  const oldImages = (ninh.images || []).filter(img => img && !img.includes(BAD_IMAGE_PATTERN));
  const newImages = [GOOD_IMAGE, ...oldImages.filter(img => img !== GOOD_IMAGE)];

  const result = await Place.updateOne(
    { _id: ninh._id },
    {
      $set: {
        image: GOOD_IMAGE,
        images: newImages
      }
    }
  );

  console.log('\n✅ Đã cập nhật:');
  console.log('   image :', GOOD_IMAGE);
  console.log('   images:', newImages);
  console.log('   Modified:', result.modifiedCount, 'document');

  await mongoose.disconnect();
  console.log('\n🎉 Hoàn tất! Xóa sessionStorage trên trình duyệt (F12 > Application > Session Storage > Clear All) để thấy ảnh mới.');
}

main().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
