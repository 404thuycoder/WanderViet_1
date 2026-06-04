require('dotenv').config();
const mongoose = require('mongoose');

// Define Place schema locally to ensure clean execution without model registration conflict
const placeSchema = new mongoose.Schema({
  id: String,
  name: String,
  kind: String,
  businessCategory: String,
  region: String,
  city: String,
  address: String,
  description: String,
  image: String,
  images: [String],
  priceFrom: Number,
  priceTo: Number,
  ownerId: String,
  status: String,
  source: String,
  verified: Boolean,
  ratingAvg: String,
  reviewCount: Number,
  favoritesCount: Number,
  viewsCount: Number,
  amenities: [String],
  highlights: [String],
  createdAt: Date,
  updatedAt: Date
}, { strict: false });

const Place = mongoose.models.Place || mongoose.model('Place', placeSchema);

const SERVICES_TO_SEED = [
  {
    id: 'halong-seaplane-001',
    name: 'Tour Thủy Phi Cơ Ngắm Vịnh Hạ Long',
    kind: 'tour',
    businessCategory: 'tour',
    region: 'Hạ Long, Quảng Ninh',
    city: 'Hạ Long',
    address: 'Tuần Châu, Hạ Long',
    description: 'Trải nghiệm ngắm nhìn toàn cảnh kỳ quan thiên nhiên thế giới từ độ cao 300m trên thủy phi cơ hiện đại.',
    priceFrom: 2500000,
    priceTo: 3500000,
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
      'https://images.unsplash.com/photo-1533038590840-1cde6b5697df?w=800&q=80'
    ],
    ownerId: 'business43113762', // Ha Long Luxury Hotel
    status: 'approved',
    source: 'partner',
    verified: true,
    ratingAvg: '5.0',
    reviewCount: 12,
    favoritesCount: 84,
    viewsCount: 412,
    amenities: ['Hướng dẫn viên', 'Bảo hiểm', 'Nước uống', 'Hỗ trợ 24/7'],
    highlights: ['Bay lượn trên các hòn đảo', 'Cất hạ cánh trên mặt nước', 'Góc nhìn Panorama']
  },
  {
    id: 'halong-sunworld-001',
    name: 'Vé Tổ Hợp Vui Chơi Sun World Ha Long',
    kind: 'dich-vu',
    businessCategory: 'activity',
    region: 'Hạ Long, Quảng Ninh',
    city: 'Hạ Long',
    address: 'Bãi Cháy, Hạ Long',
    description: 'Khám phá công viên rồng, công viên nước và cáp treo Nữ Hoàng đạt nhiều kỷ lục thế giới.',
    priceFrom: 350000,
    priceTo: 700000,
    image: 'https://images.unsplash.com/photo-1533038590840-1cde6b5697df?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1533038590840-1cde6b5697df?w=800&q=80',
      'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=800&q=80',
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80'
    ],
    ownerId: 'business43113762',
    status: 'approved',
    source: 'partner',
    verified: true,
    ratingAvg: '4.8',
    reviewCount: 24,
    favoritesCount: 156,
    viewsCount: 689,
    amenities: ['Lối đi ưu tiên', 'Bãi đỗ xe', 'Wi-Fi'],
    highlights: ['Cáp treo Nữ Hoàng', 'Vòng quay Mặt Trời', 'Tàu lượn siêu tốc']
  },
  {
    id: 'halong-dinner-001',
    name: 'Bữa Tối Lãng Mạn Trên Bãi Biển - Luxury Dinner',
    kind: 'nha-hang',
    businessCategory: 'restaurant',
    region: 'Hạ Long, Quảng Ninh',
    city: 'Hạ Long',
    address: 'Bãi biển riêng Ha Long Luxury',
    description: 'Thưởng thức hải sản cao cấp dưới ánh nến và tiếng sóng vỗ rì rào tại bãi biển riêng tư.',
    priceFrom: 1200000,
    priceTo: 2500000,
    image: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      'https://images.unsplash.com/photo-1509722747041-074f18d68246?w=800&q=80'
    ],
    ownerId: 'business43113762',
    status: 'approved',
    source: 'partner',
    verified: true,
    ratingAvg: '4.9',
    reviewCount: 8,
    favoritesCount: 92,
    viewsCount: 320,
    amenities: ['Rượu vang', 'Nhạc không lời', 'Trang trí theo yêu cầu', 'Ẩm thực tại chỗ'],
    highlights: ['Hải sản tươi sống', 'Không gian riêng tư', 'Hoàng hôn trên biển']
  },
  {
    id: 'halong-squid-001',
    name: 'Trải Nghiệm Câu Mực Đêm Cùng Ngư Dân',
    kind: 'trai-nghiem',
    businessCategory: 'activity',
    region: 'Hạ Long, Quảng Ninh',
    city: 'Hạ Long',
    address: 'Vịnh Hạ Long',
    description: 'Trở thành ngư dân thực thụ với hoạt động câu mực đêm giữa biển khơi và thưởng thức chiến lợi phẩm ngay tại tàu.',
    priceFrom: 450000,
    priceTo: 600000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
    ],
    ownerId: 'business43113762',
    status: 'approved',
    source: 'partner',
    verified: true,
    ratingAvg: '4.7',
    reviewCount: 15,
    favoritesCount: 74,
    viewsCount: 285,
    amenities: ['Cần câu chuyên nghiệp', 'Áo phao', 'Chế biến tại chỗ', 'Hướng dẫn viên'],
    highlights: ['Trải nghiệm đời sống ngư dân', 'Thưởng thức mực tươi', 'Vịnh Hạ Long về đêm']
  },
  {
    id: 'halong-spa-001',
    name: 'Dịch Vụ Spa & Massage Đá Nóng Cao Cấp',
    kind: 'dich-vu',
    businessCategory: 'spa',
    region: 'Hạ Long, Quảng Ninh',
    city: 'Hạ Long',
    address: 'Tầng 5, Ha Long Luxury Hotel',
    description: 'Thư giãn tuyệt đối với liệu pháp massage đá nóng và tinh dầu thảo mộc thiên nhiên.',
    priceFrom: 600000,
    priceTo: 1500000,
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80'
    ],
    ownerId: 'business43113762',
    status: 'approved',
    source: 'partner',
    verified: true,
    ratingAvg: '4.9',
    reviewCount: 19,
    favoritesCount: 110,
    viewsCount: 456,
    amenities: ['Trà thảo mộc', 'Xông hơi miễn phí', 'Khăn ấm', 'Hỗ trợ 24/7'],
    highlights: ['Kỹ thuật viên chuyên nghiệp', 'View biển trực diện', 'Tinh dầu organic']
  },
  {
    id: 'tuyenquang-hotel-001',
    name: 'Khách sạn Anh Thủy',
    kind: 'khach-san',
    businessCategory: 'hotel',
    region: 'Tuyên Quang',
    city: 'Tuyên Quang',
    address: '128 Đường Bờ Sông, TP. Tuyên Quang',
    description: 'Khách sạn cao cấp với phòng nghỉ hiện đại, đầy đủ tiện nghi, view sông Lô thơ mộng.',
    priceFrom: 2200000,
    priceTo: 3500000,
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'
    ],
    ownerId: 'business52623887', // Mường Thanh Tuyên Quang business account
    status: 'approved',
    source: 'partner',
    verified: true,
    ratingAvg: '5.0',
    reviewCount: 30,
    favoritesCount: 240,
    viewsCount: 1204,
    amenities: ['Bãi đỗ xe', 'Wi-Fi', 'Hỗ trợ 24/7', 'Đặt vé online'],
    highlights: ['View sông Lô trực diện', 'Thiết kế sang trọng', 'Vị trí đắc địa trung tâm']
  },
  {
    id: 'halong-mountain-001',
    name: 'Tour Leo Núi Bài Thơ Ngắm Toàn Cảnh Vịnh',
    kind: 'tour',
    businessCategory: 'tour',
    region: 'Hạ Long, Quảng Ninh',
    city: 'Hạ Long',
    address: 'Phường Hòn Gai, Hạ Long',
    description: 'Chinh phục đỉnh núi Bài Thơ để phóng tầm mắt thu trọn vẻ đẹp hùng vĩ của Vịnh Hạ Long và thành phố.',
    priceFrom: 200000,
    priceTo: 400000,
    image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&q=80'
    ],
    ownerId: 'business43113762',
    status: 'approved',
    source: 'partner',
    verified: true,
    ratingAvg: '4.8',
    reviewCount: 6,
    favoritesCount: 45,
    viewsCount: 188,
    amenities: ['Gậy leo núi', 'Nước uống', 'Đồ ăn nhẹ', 'Hướng dẫn viên'],
    highlights: ['Góc nhìn đẹp nhất Hạ Long', 'Di tích lịch sử', 'Không khí trong lành']
  },
  {
    id: 'halong-kayak-001',
    name: 'Tour Chèo Kayak Khám Phá Hang Luồn',
    kind: 'tour',
    businessCategory: 'tour',
    region: 'Hạ Long, Quảng Ninh',
    city: 'Hạ Long',
    address: 'Hang Luồn, Vịnh Hạ Long',
    description: 'Tự tay chèo lái chiếc Kayak len lỏi qua những hang động kỳ bí và ngắm nhìn đàn khỉ hoang dã.',
    priceFrom: 150000,
    priceTo: 300000,
    image: 'https://images.unsplash.com/photo-1544551763-47a0159f9234?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1544551763-47a0159f9234?w=800&q=80'
    ],
    ownerId: 'business43113762',
    status: 'approved',
    source: 'partner',
    verified: true,
    ratingAvg: '4.9',
    reviewCount: 14,
    favoritesCount: 65,
    viewsCount: 310,
    amenities: ['Dụng cụ bảo hộ', 'Kayak chuyên dụng', 'Wi-Fi'],
    highlights: ['Ngắm khỉ vàng', 'Hang động xuyên thủy', 'Check-in mặt nước']
  }
];

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI.trim());
  console.log('Connected to MongoDB.');

  let added = 0;
  for (const s of SERVICES_TO_SEED) {
    const data = {
      ...s,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await Place.findOneAndUpdate({ id: s.id }, data, { upsert: true, new: true });
    console.log(`Upserted service: "${s.name}" (id: ${s.id})`);
    added++;
  }

  console.log(`Successfully seeded ${added} partner services.`);
  await mongoose.connection.close();
}

seed().catch(err => {
  console.error('Error seeding:', err);
  process.exit(1);
});
