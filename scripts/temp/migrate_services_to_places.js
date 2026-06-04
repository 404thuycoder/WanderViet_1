/**
 * Migrate services collection → places collection
 * Chuyển dịch vụ doanh nghiệp từ collection cũ (services) sang collection mới (places)
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Map category sang kind cho Places
const categoryToKind = {
  hotel: 'khach-san',
  restaurant: 'nha-hang',
  tour: 'tour',
  spa: 'spa',
  activity: 'hoat-dong',
  transport: 'van-chuyen',
  other: 'dich-vu'
};

// Hàm sinh id theo kind
function generateId(kind) {
  const prefix = kind.split('-')[0].toLowerCase();
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // Lấy tất cả services
  const services = await db.collection('services').find({}).toArray();
  console.log(`📦 Tìm thấy ${services.length} dịch vụ trong collection cũ`);

  // Lấy danh sách businessaccounts để map owner
  const bizAccounts = await db.collection('businessaccounts').find({}).toArray();
  const bizMap = new Map();
  bizAccounts.forEach(b => {
    bizMap.set(b._id.toString(), b.customId || b._id.toString());
  });

  let migrated = 0, skipped = 0;

  for (const svc of services) {
    // Bỏ qua nếu là tên địa điểm hệ thống (không phải dịch vụ thực)
    const systemPlaceNames = [
      'Phú Quốc', 'Hội An', 'Sa Pa', 'Vịnh Hạ Long', 'Hà Nội',
      'Đà Lạt', 'Đà Nẵng', 'Nha Trang', 'Cần Thơ', 'Ninh Bình',
      'Huế', 'Hà Giang', 'Côn Đảo', 'Quy Nhơn', 'Mũi Né – Phan Thiết',
      'TP. Hồ Chí Minh', 'Buôn Ma Thuột', 'Tam Đảo', 'Làng Chài Cổ Thạch',
      'Đỉnh Fansipan', 'Mộc Châu', 'Phong Nha - Kẻ Bàng', 'Pù Luông', 'Phú Yên'
    ];

    if (systemPlaceNames.includes(svc.name)) {
      console.log(`  ⏭️ Bỏ qua (tên địa điểm hệ thống): ${svc.name}`);
      skipped++;
      continue;
    }

    // Map ownerId
    const ownerId = svc.owner
      ? (bizMap.get(svc.owner.toString()) || svc.owner.toString())
      : null;

    const kind = categoryToKind[svc.category] || 'dich-vu';

    // Kiểm tra xem đã migrate chưa (dựa theo legacyId)
    const existing = await db.collection('places').findOne({ legacyServiceId: svc._id.toString() });
    if (existing) {
      console.log(`  ⏭️ Đã migrate rồi: ${svc.name}`);
      skipped++;
      continue;
    }

    const newPlace = {
      id: generateId(kind),
      name: svc.name,
      kind: kind,
      businessCategory: svc.category || 'other',
      region: svc.location || '',
      city: svc.location || '',
      address: svc.location || '',
      description: svc.description || `${svc.name} - ${svc.location}`,
      image: svc.image && !svc.image.includes('placeholder') ? svc.image : '',
      images: svc.image && !svc.image.includes('placeholder') ? [svc.image] : [],
      gallery: [],
      priceFrom: svc.price || 0,
      priceTo: null,
      ownerId: ownerId,
      source: 'partner',
      status: 'approved', // đã active trong hệ thống cũ → duyệt luôn
      isTour: svc.category === 'tour',
      ratingAvg: svc.rating ? svc.rating.toString() : '0',
      reviewCount: 0,
      favoritesCount: 0,
      viewsCount: svc.views || 0,
      legacyServiceId: svc._id.toString(), // để track migration
      createdAt: svc.createdAt || new Date(),
      updatedAt: new Date()
    };

    await db.collection('places').insertOne(newPlace);
    console.log(`  ✅ Migrated: ${svc.name} [${svc.category}] → kind:${kind}, owner:${ownerId}`);
    migrated++;
  }

  console.log(`\n🎉 Hoàn thành! Migrated: ${migrated}, Skipped: ${skipped}`);

  // Kết quả sau migrate
  const total = await db.collection('places').countDocuments();
  const bizPlaces = await db.collection('places').countDocuments({ source: 'partner' });
  console.log(`\n📊 Sau migrate: Tổng ${total} places, Doanh nghiệp: ${bizPlaces}`);

  mongoose.connection.close();
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
