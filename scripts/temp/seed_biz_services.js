/**
 * Seed dữ liệu demo dịch vụ cho các business accounts còn lại
 * Mỗi business sẽ có 2-3 dịch vụ trong collection 'places'
 */
require('dotenv').config();
const mongoose = require('mongoose');

function generateId(kind) {
  const prefix = kind.split('-')[0].toLowerCase();
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

const DEMO_SERVICES = [
  // business18017811 - halongluxury.com
  {
    ownerId: 'business18017811',
    name: 'Phòng Deluxe View Vịnh Hạ Long',
    kind: 'khach-san',
    businessCategory: 'hotel',
    region: 'Quảng Ninh',
    city: 'Hạ Long',
    address: '12 Bãi Cháy, Hạ Long, Quảng Ninh',
    description: 'Phòng Deluxe sang trọng với view trực diện Vịnh Hạ Long, nội thất cao cấp, ban công riêng.',
    priceFrom: 1800000,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    isTour: false
  },
  {
    ownerId: 'business18017811',
    name: 'Cruise Hạ Long 1 Ngày Cao Cấp',
    kind: 'tour',
    businessCategory: 'tour',
    region: 'Quảng Ninh',
    city: 'Hạ Long',
    address: 'Cảng Tuần Châu, Hạ Long',
    description: 'Trải nghiệm du thuyền Hạ Long 1 ngày với bữa trưa hải sản, chèo kayak, và tham quan hang động.',
    priceFrom: 950000,
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    isTour: true
  },
  // business52623887 - Mường Thanh Tuyên Quang
  {
    ownerId: 'business52623887',
    name: 'Mường Thanh Grand Tuyên Quang',
    kind: 'khach-san',
    businessCategory: 'hotel',
    region: 'Tuyên Quang',
    city: 'Tuyên Quang',
    address: '168 đường Bình Thuận, TP. Tuyên Quang',
    description: 'Khách sạn 5 sao đầu tiên tại Tuyên Quang. Hệ thống bể bơi, spa, nhà hàng và phòng hội nghị đẳng cấp.',
    priceFrom: 1200000,
    image: 'https://images.unsplash.com/photo-1551882547-ff40c4d60493?w=800&q=80',
    isTour: false
  },
  {
    ownerId: 'business52623887',
    name: 'Tour Tuyên Quang Sinh Thái 2N1Đ',
    kind: 'tour',
    businessCategory: 'tour',
    region: 'Tuyên Quang',
    city: 'Tuyên Quang',
    address: 'TP. Tuyên Quang',
    description: 'Khám phá thiên nhiên Tuyên Quang: thác Bản Ba, hồ Na Hang, rừng đặc dụng Na Hang.',
    priceFrom: 1500000,
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
    isTour: true
  },
  // business68662868 - Mường Thanh
  {
    ownerId: 'business68662868',
    name: 'Mường Thanh Luxury Hà Nội Centre',
    kind: 'khach-san',
    businessCategory: 'hotel',
    region: 'Hà Nội',
    city: 'Hà Nội',
    address: '8 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
    description: 'Khách sạn cao cấp 4 sao tại trung tâm Hà Nội. Vị trí đắc địa gần Hồ Gươm, thuận tiện di chuyển.',
    priceFrom: 950000,
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
    isTour: false
  },
  {
    ownerId: 'business68662868',
    name: 'Spa & Wellness Mường Thanh',
    kind: 'dich-vu',
    businessCategory: 'spa',
    region: 'Hà Nội',
    city: 'Hà Nội',
    address: '8 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
    description: 'Liệu pháp thư giãn toàn thân với các bài massage truyền thống Việt Nam kết hợp công nghệ hiện đại.',
    priceFrom: 450000,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
    isTour: false
  },
  // business76123070 - Tông Trang Thôn
  {
    ownerId: 'business76123070',
    name: 'Homestay Tông Trang Thôn Mộc Châu',
    kind: 'khach-san',
    businessCategory: 'hotel',
    region: 'Sơn La',
    city: 'Mộc Châu',
    address: 'Bản Tông Trang, Thị trấn Mộc Châu, Sơn La',
    description: 'Homestay phong cách dân tộc Thái giữa đồi chè xanh mướt Mộc Châu. Không gian yên bình, ẩm thực địa phương đặc sắc.',
    priceFrom: 480000,
    image: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80',
    isTour: false
  },
  {
    ownerId: 'business76123070',
    name: 'Tour Mộc Châu Mùa Hoa Cải',
    kind: 'tour',
    businessCategory: 'tour',
    region: 'Sơn La',
    city: 'Mộc Châu',
    address: 'Thị trấn Mộc Châu, Sơn La',
    description: 'Trải nghiệm Mộc Châu mùa hoa cải trắng nở rộ tháng 11-12. Khám phá đồi chè, thác Dải Yếm, hang Pha Luông.',
    priceFrom: 1200000,
    image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80',
    isTour: true
  },
  // BIZ-RENTAL-HN - WanderCar Hà Nội
  {
    ownerId: 'BIZ-RENTAL-HN',
    name: 'Thuê Xe 7 Chỗ Hà Nội – Có Tài Xế',
    kind: 'dich-vu',
    businessCategory: 'transport',
    region: 'Hà Nội',
    city: 'Hà Nội',
    address: 'Phục vụ toàn Hà Nội và các tỉnh lân cận',
    description: 'Dịch vụ cho thuê xe 7 chỗ có tài xế chuyên nghiệp tại Hà Nội. Xe đời mới, điều hòa, GPS, phục vụ 24/7.',
    priceFrom: 1200000,
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
    isTour: false
  },
  {
    ownerId: 'BIZ-RENTAL-HN',
    name: 'Xe Limousine Hà Nội – Sapa',
    kind: 'dich-vu',
    businessCategory: 'transport',
    region: 'Hà Nội',
    city: 'Hà Nội',
    address: 'Xuất phát từ Hà Nội đến Sa Pa',
    description: 'Xe limousine VIP giường nằm tuyến Hà Nội – Sa Pa. Ghế massage, wifi, đồ ăn nhẹ miễn phí, đón tận nơi.',
    priceFrom: 320000,
    image: 'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=800&q=80',
    isTour: false
  },
  // BIZ-RENTAL-SG - WanderCar Sài Gòn
  {
    ownerId: 'BIZ-RENTAL-SG',
    name: 'Thuê Xe 4 Chỗ TP.HCM Tự Lái',
    kind: 'dich-vu',
    businessCategory: 'transport',
    region: 'TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    address: 'Nhiều điểm giao xe trên toàn TP.HCM',
    description: 'Thuê xe 4 chỗ tự lái tại TP.HCM. Xe Toyota Vios, Honda City đời mới. Bảo hiểm toàn diện, hỗ trợ 24/7.',
    priceFrom: 650000,
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80',
    isTour: false
  },
  // BIZ-RENTAL-PQ - Nhà xe Phú Quốc Xanh
  {
    ownerId: 'BIZ-RENTAL-PQ',
    name: 'Thuê Xe Máy Phú Quốc',
    kind: 'dich-vu',
    businessCategory: 'transport',
    region: 'Kiên Giang',
    city: 'Phú Quốc',
    address: 'Dương Tơ, Phú Quốc, Kiên Giang',
    description: 'Thuê xe máy tự lái khám phá Phú Quốc. Honda Vision, Wave Alpha, đủ loại. Giao nhận tận nơi.',
    priceFrom: 150000,
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80',
    isTour: false
  },
  {
    ownerId: 'BIZ-RENTAL-PQ',
    name: 'Tour Câu Cá Phú Quốc – Nướng Tại Chỗ',
    kind: 'tour',
    businessCategory: 'tour',
    region: 'Kiên Giang',
    city: 'Phú Quốc',
    address: 'Bến cảng An Thới, Phú Quốc',
    description: 'Trải nghiệm câu cá giữa biển Phú Quốc, nướng hải sản tươi sống tại chỗ. Bao gồm cần câu, mồi, dụng cụ.',
    priceFrom: 450000,
    image: 'https://images.unsplash.com/photo-1498654200943-1088dd4438ae?w=800&q=80',
    isTour: true
  }
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  let added = 0;
  let skipped = 0;

  for (const svc of DEMO_SERVICES) {
    // Check duplicate
    const existing = await db.collection('places').findOne({ name: svc.name, ownerId: svc.ownerId });
    if (existing) {
      console.log(`  ⏭️ Đã tồn tại: "${svc.name}"`);
      skipped++;
      continue;
    }

    const newPlace = {
      id: generateId(svc.kind),
      name: svc.name,
      kind: svc.kind,
      businessCategory: svc.businessCategory,
      region: svc.region,
      city: svc.city,
      address: svc.address,
      description: svc.description,
      image: svc.image,
      images: [svc.image],
      gallery: [],
      priceFrom: svc.priceFrom,
      priceTo: null,
      ownerId: svc.ownerId,
      source: 'partner',
      status: 'approved',
      isTour: svc.isTour || false,
      ratingAvg: '0',
      reviewCount: 0,
      favoritesCount: Math.floor(Math.random() * 50),
      viewsCount: Math.floor(Math.random() * 500) + 50,
      tags: [],
      highlights: [],
      amenities: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('places').insertOne(newPlace);
    console.log(`  ✅ Đã thêm: "${svc.name}" [${svc.kind}] → owner:${svc.ownerId}`);
    added++;

    // Small delay to avoid duplicate ids from Date.now()
    await new Promise(r => setTimeout(r, 10));
  }

  const total = await db.collection('places').countDocuments();
  const bizTotal = await db.collection('places').countDocuments({ source: 'partner' });
  console.log(`\n🎉 Xong! Thêm ${added}, bỏ qua ${skipped}`);
  console.log(`📊 Tổng places: ${total}, Doanh nghiệp: ${bizTotal}`);

  mongoose.connection.close();
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
