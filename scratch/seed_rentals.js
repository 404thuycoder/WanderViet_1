require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const BusinessAccount = require('../server/models/BusinessAccount');
const Place = require('../server/models/Place');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wanderviet';

async function seedRentals() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(MONGODB_URI);
        console.log('Successfully connected to DB:', mongoose.connection.name);

        // 1. Define dummy businesses
        const businesses = [
            {
                customId: 'BIZ-RENTAL-HN',
                name: 'WanderCar Hà Nội',
                displayName: 'WanderCar Hà Nội',
                email: 'hanoi@wandercar.vn',
                phone: '0912345678',
                status: 'active',
                isVerified: true,
                category: 'other',
                bio: 'Dịch vụ cho thuê xe tự lái & xe đi tỉnh cao cấp hàng đầu tại Hà Nội.',
                address: '12 Đường Láng, Quận Đống Đa, Hà Nội',
                followersCount: 142,
                ratingAvg: 4.9,
                reviewCount: 28
            },
            {
                customId: 'BIZ-RENTAL-SG',
                name: 'WanderCar Sài Gòn',
                displayName: 'WanderCar Sài Gòn',
                email: 'saigon@wandercar.vn',
                phone: '0987654321',
                status: 'active',
                isVerified: true,
                category: 'other',
                bio: 'Thuê xe tự lái 4-7 chỗ đời mới và dịch vụ xe đi tỉnh trọn gói tại TP.HCM.',
                address: '240 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh',
                followersCount: 215,
                ratingAvg: 4.8,
                reviewCount: 39
            },
            {
                customId: 'BIZ-RENTAL-PQ',
                name: 'Nhà xe Phú Quốc Xanh',
                displayName: 'Nhà xe Phú Quốc Xanh',
                email: 'phuquoc@wandercar.vn',
                phone: '0933334444',
                status: 'active',
                isVerified: true,
                category: 'other',
                bio: 'Cho thuê xe máy & ô tô tự lái giao nhận tận nơi miễn phí tại sân bay Phú Quốc.',
                address: 'Đường Trần Hưng Đạo, Dương Đông, Phú Quốc',
                followersCount: 89,
                ratingAvg: 5.0,
                reviewCount: 17
            }
        ];

        // Seed Business Accounts
        console.log('Seeding business accounts...');
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('123456', salt);

        for (const bizData of businesses) {
            await BusinessAccount.deleteOne({ customId: bizData.customId });
            const biz = new BusinessAccount({
                ...bizData,
                password: defaultPassword
            });
            await biz.save();
            console.log(`- Seeded Business: ${biz.name}`);
        }

        // 2. Define dummy rental places
        const rentalPlaces = [
            {
                id: 'place-rental-hanoi',
                name: 'WanderCar Hà Nội - Dịch Vụ Xe Tự Lái & Đi Tỉnh',
                slug: 'wandercar-ha-noi',
                kind: 'thue-xe',
                businessCategory: 'rental',
                category: 'Thuê xe & Di chuyển',
                ownerId: 'BIZ-RENTAL-HN',
                ownerName: 'WanderCar Hà Nội',
                priceFrom: 800000,
                priceTo: 2200000,
                averagePrice: 1200000,
                ratingAvg: '4.9',
                reviewCount: 28,
                region: 'Hà Nội',
                city: 'Hà Nội',
                address: '12 Đường Láng, Quận Đống Đa, Hà Nội',
                description: 'Dịch vụ cho thuê xe ô tô tự lái và có tài xế đường dài uy tín hàng đầu tại Hà Nội. Đội ngũ xe đời mới, sạch sẽ từ 4 chỗ đến 16 chỗ. Hỗ trợ giao xe tận nhà và sân bay Nội Bài.',
                overview: 'WanderCar Hà Nội mang lại trải nghiệm thuê xe cao cấp và yên tâm tuyệt đối cho chuyến đi của bạn. Chúng tôi cam kết xe giao đúng hẹn, luôn được vệ sinh khử khuẩn sạch sẽ trước khi bàn giao và được bảo dưỡng định kỳ tại các đại lý chính hãng.',
                highlights: [
                    'Xe đời mới 2022 - 2024 sạch sẽ, không mùi thuốc lá',
                    'Thủ tục nhanh gọn, nhận xe chỉ trong 10 phút',
                    'Hỗ trợ giao xe tận nơi miễn phí bán kính 5km',
                    'Bảo hiểm vật chất xe hai chiều đầy đủ',
                    'Hỗ trợ kỹ thuật và cứu hộ 24/7 toàn quốc'
                ],
                image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
                images: [
                    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
                    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
                    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80'
                ],
                tags: ['cho-thue-xe', 'xe-tu-lai', 'xe-di-tinh', 'ha-noi'],
                verified: true,
                status: 'approved',
                source: 'partner'
            },
            {
                id: 'place-rental-saigon',
                name: 'WanderCar Sài Gòn - Thuê Xe Ô Tô Cao Cấp',
                slug: 'wandercar-sai-gon',
                kind: 'thue-xe',
                businessCategory: 'rental',
                category: 'Thuê xe & Di chuyển',
                ownerId: 'BIZ-RENTAL-SG',
                ownerName: 'WanderCar Sài Gòn',
                priceFrom: 950000,
                priceTo: 2500000,
                averagePrice: 1500000,
                ratingAvg: '4.8',
                reviewCount: 39,
                region: 'Hồ Chí Minh',
                city: 'Hồ Chí Minh',
                address: '240 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh',
                description: 'Cung cấp các dòng xe ô tô tự lái và có tài xế từ 4 chỗ, 7 chỗ đời mới (Toyota Vios, Honda City, Mitsubishi Xpander, Kia Carnival). Thích hợp cho gia đình đi du lịch, công tác hoặc đi tỉnh.',
                overview: 'Hệ thống cho thuê xe WanderCar Sài Gòn chuyên phục vụ các dòng xe phân khúc từ phổ thông đến cao cấp tại khu vực TP.HCM. Tất cả xe đều trang bị camera hành trình, bản đồ chỉ đường thông minh và hệ thống cảm biến an toàn.',
                highlights: [
                    'Sở hữu dòng xe Kia Carnival cao cấp thích hợp đi gia đình đông người',
                    'Giao xe trực tiếp tại Sân bay Tân Sơn Nhất nhanh chóng',
                    'Không giới hạn số km di chuyển trong ngày',
                    'Rửa xe và vệ sinh miễn phí trước khi giao xe',
                    'Hỗ trợ xuất hóa đơn VAT nhanh chóng cho doanh nghiệp'
                ],
                image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
                images: [
                    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
                    'https://images.unsplash.com/photo-1525609004556-c46c7d6cf0a3?w=800&q=80',
                    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80'
                ],
                tags: ['cho-thue-xe', 'xe-tu-lai', 'kia-carnival', 'sai-gon'],
                verified: true,
                status: 'approved',
                source: 'partner'
            },
            {
                id: 'place-rental-phuquoc',
                name: 'Nhà xe Phú Quốc Xanh - Thuê Xe Máy & Xe Tự Lái Giá Rẻ',
                slug: 'nha-xe-phu-quoc-xanh',
                kind: 'thue-xe',
                businessCategory: 'rental',
                category: 'Thuê xe & Di chuyển',
                ownerId: 'BIZ-RENTAL-PQ',
                ownerName: 'Nhà xe Phú Quốc Xanh',
                priceFrom: 150000,
                priceTo: 1000000,
                averagePrice: 500000,
                ratingAvg: '5.0',
                reviewCount: 17,
                region: 'Phú Quốc',
                city: 'Kiên Giang',
                address: 'Đường Trần Hưng Đạo, Dương Đông, Phú Quốc',
                description: 'Đơn vị chuyên cho thuê xe máy (Honda Vision, AirBlade, Lead, Exciter) và xe ô tô tự lái từ 4 đến 7 chỗ phục vụ du khách khám phá đảo ngọc Phú Quốc.',
                overview: 'Khám phá Phú Quốc trọn vẹn và chủ động nhất với dịch vụ thuê xe máy và ô tô của Phú Quốc Xanh. Chúng tôi tự hào là đơn vị uy tín lâu năm, được hàng ngàn du khách đánh giá 5 sao trên các nền tảng du lịch.',
                highlights: [
                    'Giá thuê xe máy siêu tiết kiệm chỉ từ 150.000đ/ngày',
                    'Tặng kèm 2 nón bảo hiểm đạt chuẩn, 2 áo mưa và bản đồ Phú Quốc',
                    'Giao xe miễn phí tại Sân bay Phú Quốc và các khách sạn Dương Đông',
                    'Xe máy luôn được bảo dưỡng, thay nhớt hàng tháng',
                    'Thủ tục đơn giản: Chỉ cần giữ CCCD/Hộ chiếu'
                ],
                image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80',
                images: [
                    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80',
                    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80'
                ],
                tags: ['thue-xe-may', 'xe-may-phu-quoc', 'phu-quoc', 'gia-re'],
                verified: true,
                status: 'approved',
                source: 'partner'
            }
        ];

        // Seed Places
        console.log('Seeding places...');
        for (const placeData of rentalPlaces) {
            await Place.deleteOne({ id: placeData.id });
            const place = new Place(placeData);
            await place.save();
            console.log(`- Seeded Place: ${place.name} (${place.region})`);
        }

        console.log('Database seeding completed successfully!');
    } catch (err) {
        console.error('Error during seeding:', err);
    } finally {
        mongoose.disconnect();
        console.log('Disconnected from DB');
        process.exit(0);
    }
}

seedRentals();
