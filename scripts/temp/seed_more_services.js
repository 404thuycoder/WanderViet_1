/**
 * Seed thêm dịch vụ ẩm thực và các loại khác để dữ liệu phong phú hơn
 */
require('dotenv').config();
const mongoose = require('mongoose');

function generateId(kind) {
  const prefix = kind.split('-')[0].toLowerCase();
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

const MORE_SERVICES = [
  // ẨM THỰC - Nhà hàng (nha-hang)
  {
    ownerId: 'business43113762', // Ha Long Luxury Hotel
    name: 'Nhà Hàng Hải Sản Hạ Long Premium',
    kind: 'nha-hang', businessCategory: 'restaurant',
    region: 'Quảng Ninh', city: 'Hạ Long', address: 'Cảng Hòn Gai, Hạ Long',
    description: 'Nhà hàng hải sản tươi sống với view biển Hạ Long. Menu đặc sản: tôm hùm, ghẹ, ngao, mực nướng.',
    priceFrom: 350000,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', isTour: false
  },
  {
    ownerId: 'business18017811', // halongluxury.com
    name: 'Bar & Dining Sunset Hạ Long',
    kind: 'nha-hang', businessCategory: 'restaurant',
    region: 'Quảng Ninh', city: 'Hạ Long', address: 'Tuần Châu, Hạ Long',
    description: 'Không gian ăn uống lãng mạn nhìn ra biển. Đặc biệt có cocktail tươi và món Á Âu fusion.',
    priceFrom: 280000,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', isTour: false
  },
  {
    ownerId: 'business52623887', // Mường Thanh Tuyên Quang
    name: 'Nhà Hàng Đặc Sản Tuyên Quang',
    kind: 'nha-hang', businessCategory: 'restaurant',
    region: 'Tuyên Quang', city: 'Tuyên Quang', address: '168 Bình Thuận, TP. Tuyên Quang',
    description: 'Thưởng thức đặc sản vùng núi Tuyên Quang: cá suối nướng than, thịt lợn bản, rau rừng.',
    priceFrom: 200000,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', isTour: false
  },
  {
    ownerId: 'business68662868', // Mường Thanh
    name: 'Nhà Hàng Buffet Quốc Tế Mường Thanh HN',
    kind: 'nha-hang', businessCategory: 'restaurant',
    region: 'Hà Nội', city: 'Hà Nội', address: '8 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
    description: 'Buffet sáng và tối với hơn 80 món ăn quốc tế và Việt Nam. Khu hải sản, nướng, lẩu live station.',
    priceFrom: 320000,
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80', isTour: false
  },
  {
    ownerId: 'business76123070', // Tông Trang Thôn
    name: 'Ẩm Thực Dân Tộc Thái Mộc Châu',
    kind: 'nha-hang', businessCategory: 'restaurant',
    region: 'Sơn La', city: 'Mộc Châu', address: 'Bản Tông Trang, Mộc Châu',
    description: 'Thưởng thức bữa cơm nhà sàn với các món dân tộc Thái: cá nướng lam, xôi nếp nương, thịt trâu gác bếp.',
    priceFrom: 180000,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', isTour: false
  },
  // THÊM CÁC LOẠI DỊCH VỤ KHÁC
  {
    ownerId: 'business43113762',
    name: 'Hội Nghị & Sự Kiện Hạ Long Heritage',
    kind: 'dich-vu', businessCategory: 'meeting',
    region: 'Quảng Ninh', city: 'Hạ Long', address: 'Hạ Long, Quảng Ninh',
    description: 'Phòng hội nghị hiện đại sức chứa 500 người. Đầy đủ thiết bị AV, wifi tốc độ cao, catering theo yêu cầu.',
    priceFrom: 5000000, image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', isTour: false
  },
  {
    ownerId: 'business52623887',
    name: 'Bể Bơi & Fitness Mường Thanh TQ',
    kind: 'dich-vu', businessCategory: 'spa',
    region: 'Tuyên Quang', city: 'Tuyên Quang', address: '168 Bình Thuận, TP. Tuyên Quang',
    description: 'Bể bơi vô cực 25m, phòng gym hiện đại, sauna và hơi nước. Mở cửa 6h-22h hàng ngày.',
    priceFrom: 150000, image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80', isTour: false
  },
  {
    ownerId: 'business68662868',
    name: 'Đưa Đón Sân Bay Nội Bài – Mường Thanh',
    kind: 'dich-vu', businessCategory: 'transport',
    region: 'Hà Nội', city: 'Hà Nội', address: 'Sân bay Nội Bài đến Trung tâm Hà Nội',
    description: 'Dịch vụ đưa đón sân bay Nội Bài bằng xe limousine cao cấp. Bao gồm nước uống, wifi. Đặt trước 2 tiếng.',
    priceFrom: 250000, image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80', isTour: false
  },
  {
    ownerId: 'business76123070',
    name: 'Trải Nghiệm Làm Nông – Homestay Mộc Châu',
    kind: 'trai-nghiem', businessCategory: 'activity',
    region: 'Sơn La', city: 'Mộc Châu', address: 'Bản Tông Trang, Mộc Châu',
    description: 'Tham gia thu hoạch chè, cấy lúa cùng người dân Thái bản địa. Trải nghiệm văn hóa đích thực 1 ngày.',
    priceFrom: 350000, image: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&q=80', isTour: false
  },
  {
    ownerId: 'BIZ-RENTAL-HN',
    name: 'Thuê Xe Bus Du Lịch – Hà Nội',
    kind: 'dich-vu', businessCategory: 'transport',
    region: 'Hà Nội', city: 'Hà Nội', address: 'Hà Nội và các tỉnh phía Bắc',
    description: 'Cho thuê xe 16-45 chỗ phục vụ đoàn du lịch, sự kiện doanh nghiệp. Tài xế kinh nghiệm, xe điều hoà.',
    priceFrom: 2500000, image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80', isTour: false
  },
  {
    ownerId: 'BIZ-RENTAL-PQ',
    name: 'Thuê Xe Đạp Điện Phú Quốc',
    kind: 'dich-vu', businessCategory: 'transport',
    region: 'Kiên Giang', city: 'Phú Quốc', address: 'Dương Tơ, Phú Quốc',
    description: 'Xe đạp điện thân thiện môi trường, khám phá Phú Quốc theo nhịp của bạn. Pin 60km, giao tận resort.',
    priceFrom: 120000, image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80', isTour: false
  },
  {
    ownerId: 'BIZ-RENTAL-SG',
    name: 'Limousine TP.HCM – Vũng Tàu',
    kind: 'dich-vu', businessCategory: 'transport',
    region: 'TP. Hồ Chí Minh', city: 'TP. Hồ Chí Minh', address: 'Từ TP.HCM đến Vũng Tàu',
    description: 'Xe Limousine VIP 9 chỗ tuyến TP.HCM – Vũng Tàu. Wifi, nước lọc, ghế massage. Xuất bến đúng giờ.',
    priceFrom: 200000, image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80', isTour: false
  },
  // TOUR thêm
  {
    ownerId: 'business43113762',
    name: 'Lặn Biển Hạ Long Khám Phá Rạn San Hô',
    kind: 'tour', businessCategory: 'tour',
    region: 'Quảng Ninh', city: 'Hạ Long', address: 'Vịnh Hạ Long',
    description: 'Tour lặn biển chuyên nghiệp tại rạn san hô Hạ Long. Bao gồm thiết bị, hướng dẫn viên, ảnh underwater.',
    priceFrom: 1800000, image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80', isTour: true
  },
  {
    ownerId: 'business18017811',
    name: 'Kayak Khám Phá Hang Động Hạ Long',
    kind: 'tour', businessCategory: 'tour',
    region: 'Quảng Ninh', city: 'Hạ Long', address: 'Vịnh Hạ Long',
    description: 'Chèo kayak khám phá các hang động bí ẩn trong Vịnh Hạ Long. Bao gồm áo phao, hướng dẫn, snack.',
    priceFrom: 550000, image: 'https://images.unsplash.com/photo-1476611338391-6f395a0dd82b?w=800&q=80', isTour: true
  },
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  let added = 0, skipped = 0;

  for (const svc of MORE_SERVICES) {
    const existing = await db.collection('places').findOne({ name: svc.name, ownerId: svc.ownerId });
    if (existing) { console.log(`⏭️  Đã tồn tại: "${svc.name}"`); skipped++; continue; }

    const newPlace = {
      id: generateId(svc.kind),
      name: svc.name, kind: svc.kind, businessCategory: svc.businessCategory,
      region: svc.region, city: svc.city, address: svc.address,
      description: svc.description,
      image: svc.image, images: [svc.image], gallery: [],
      priceFrom: svc.priceFrom, priceTo: null,
      ownerId: svc.ownerId, source: 'partner', status: 'approved',
      isTour: svc.isTour || false,
      ratingAvg: '0', reviewCount: 0,
      favoritesCount: Math.floor(Math.random() * 80),
      viewsCount: Math.floor(Math.random() * 800) + 100,
      tags: [], highlights: [], amenities: [],
      createdAt: new Date(), updatedAt: new Date()
    };

    await db.collection('places').insertOne(newPlace);
    console.log(`✅ Thêm: [${svc.kind}] "${svc.name}" → ${svc.ownerId}`);
    added++;
    await new Promise(r => setTimeout(r, 10));
  }

  const total = await db.collection('places').countDocuments();
  const partner = await db.collection('places').countDocuments({ source: 'partner' });
  
  // Summary by kind
  const kinds = await db.collection('places').aggregate([
    { $match: { source: 'partner' } },
    { $group: { _id: '$kind', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log(`\n🎉 Thêm ${added}, bỏ qua ${skipped}`);
  console.log(`📊 Tổng: ${total} places, Doanh nghiệp: ${partner}`);
  console.log('\nPhân loại dịch vụ doanh nghiệp:');
  kinds.forEach(k => console.log(`  ${k._id}: ${k.count}`));

  mongoose.connection.close();
}).catch(err => { console.error('❌', err.message); process.exit(1); });
