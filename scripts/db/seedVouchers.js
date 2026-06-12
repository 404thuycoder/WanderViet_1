/**
 * seedVouchers.js — Script nạp lại toàn bộ dữ liệu mã giảm giá (Vouchers) vào MongoDB
 * Chạy: node scripts/db/seedVouchers.js từ thư mục gốc dự án
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Voucher = require('../../server/models/Voucher');
const BusinessAccount = require('../../server/models/BusinessAccount');
const Place = require('../../server/models/Place');

async function seedVouchers() {
  try {
    console.log('⏳ Đang kết nối tới cơ sở dữ liệu MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối thành công tới MongoDB.');

    // 1. Dọn dẹp collection vouchers cũ
    console.log('🧹 Đang làm sạch bảng vouchers cũ...');
    const deleteResult = await Voucher.deleteMany({});
    console.log(`🧹 Đã xóa ${deleteResult.deletedCount} vouchers cũ khỏi database.`);

    const vouchersToInsert = [];
    const now = new Date();
    // Tạo hạn sử dụng xa cho các voucher mẫu: 1 năm từ bây giờ
    const futureDate = new Date();
    futureDate.setFullYear(now.getFullYear() + 1);

    // 2. Định nghĩa danh sách Vouchers của ADMIN (Toàn sàn)
    const adminVouchers = [
      {
        code: 'WANDERNEW',
        title: 'Chào Mừng Bạn Mới',
        description: 'Ưu đãi đặc biệt giảm 15% cho thành viên mới đăng ký tài khoản WanderViet AI (trong 7 ngày đầu)',
        discountType: 'percent',
        discountValue: 15,
        maxDiscount: 50000,
        minOrderValue: 0,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 1000,
        perUserLimit: 1,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: true,
        status: 'active'
      },
      {
        code: 'WANDERWELCOME',
        title: 'Khám Phá Việt Nam',
        description: 'Nhập mã để nhận ngay ưu đãi giảm 10% (tối đa 30.000đ) cho đơn hàng từ 100.000đ',
        discountType: 'percent',
        discountValue: 10,
        maxDiscount: 30000,
        minOrderValue: 100000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 5000,
        perUserLimit: 3,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDERBRONZE',
        title: 'Ưu Đãi Hạng Đồng',
        description: 'Đặc quyền thành viên hạng Đồng trở lên: Giảm 10% (tối đa 50.000đ) cho đơn từ 150.000đ',
        discountType: 'percent',
        discountValue: 10,
        maxDiscount: 50000,
        minOrderValue: 150000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 2000,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: 'Đồng',
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDERSILVER',
        title: 'Ưu Đãi Hạng Bạc',
        description: 'Đặc quyền thành viên hạng Bạc trở lên: Giảm 15% (tối đa 80.000đ) cho đơn từ 200.000đ',
        discountType: 'percent',
        discountValue: 15,
        maxDiscount: 80000,
        minOrderValue: 200000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 1500,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: 'Bạc',
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDERGOLD',
        title: 'Đặc Quyền Hạng Vàng',
        description: 'Đặc quyền thành viên hạng Vàng trở lên: Giảm 20% (tối đa 120.000đ) cho đơn từ 300.000đ',
        discountType: 'percent',
        discountValue: 20,
        maxDiscount: 120000,
        minOrderValue: 300000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 1000,
        perUserLimit: 5,
        startDate: now,
        endDate: futureDate,
        minRank: 'Vàng',
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDERPLATINUM',
        title: 'Đặc Quyền Bạch Kim',
        description: 'Siêu ưu đãi hạng Bạch Kim: Giảm 25% (tối đa 200.000đ) cho đơn từ 500.000đ',
        discountType: 'percent',
        discountValue: 25,
        maxDiscount: 200000,
        minOrderValue: 500000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 800,
        perUserLimit: 5,
        startDate: now,
        endDate: futureDate,
        minRank: 'Bạch Kim',
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDERDIAMOND',
        title: 'Đặc Quyền Kim Cương',
        description: 'Siêu ưu đãi hạng Kim Cương: Giảm 30% (tối đa 350.000đ) cho đơn từ 800.000đ',
        discountType: 'percent',
        discountValue: 30,
        maxDiscount: 350000,
        minOrderValue: 800000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 500,
        perUserLimit: 10,
        startDate: now,
        endDate: futureDate,
        minRank: 'Kim Cương',
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDERLEGEND',
        title: 'Đặc Quyền Huyền Thoại',
        description: 'Ưu đãi tối cao dành riêng cho hạng Huyền Thoại: Giảm 40% (tối đa 500.000đ) cho đơn từ 1.000.000đ',
        discountType: 'percent',
        discountValue: 40,
        maxDiscount: 500000,
        minOrderValue: 1000000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 200,
        perUserLimit: 10,
        startDate: now,
        endDate: futureDate,
        minRank: 'Huyền Thoại',
        forNewUsers: false,
        status: 'active'
      }
    ];

    vouchersToInsert.push(...adminVouchers);

    // 3. Khởi tạo các Vouchers tự động cấp khi lên hạng (Rank-Up Auto-Grant templates)
    const rankUpTemplates = [
      {
        code: 'AUTO_SILVER',
        title: 'Quà Thăng Hạng Bạc',
        description: 'Voucher tri ân tự động tặng khi thăng lên hạng Bạc: Giảm 15% (tối đa 100.000đ) cho đơn từ 200.000đ',
        discountType: 'percent',
        discountValue: 15,
        maxDiscount: 100000,
        minOrderValue: 200000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 0,
        perUserLimit: 1,
        startDate: now,
        endDate: null,
        minRank: null,
        forNewUsers: false,
        autoGrantOnRank: 'Bạc',
        status: 'active'
      },
      {
        code: 'AUTO_GOLD',
        title: 'Quà Thăng Hạng Vàng',
        description: 'Voucher tri ân tự động tặng khi thăng lên hạng Vàng: Giảm 20% (tối đa 150.000đ) cho đơn từ 300.000đ',
        discountType: 'percent',
        discountValue: 20,
        maxDiscount: 150000,
        minOrderValue: 300000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 0,
        perUserLimit: 1,
        startDate: now,
        endDate: null,
        minRank: null,
        forNewUsers: false,
        autoGrantOnRank: 'Vàng',
        status: 'active'
      },
      {
        code: 'AUTO_PLATINUM',
        title: 'Quà Thăng Hạng Bạch Kim',
        description: 'Voucher tri ân tự động tặng khi thăng lên hạng Bạch Kim: Giảm 25% (tối đa 250.000đ) cho đơn từ 500.000đ',
        discountType: 'percent',
        discountValue: 25,
        maxDiscount: 250000,
        minOrderValue: 500000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 0,
        perUserLimit: 1,
        startDate: now,
        endDate: null,
        minRank: null,
        forNewUsers: false,
        autoGrantOnRank: 'Bạch Kim',
        status: 'active'
      },
      {
        code: 'AUTO_DIAMOND',
        title: 'Quà Thăng Hạng Kim Cương',
        description: 'Voucher tri ân tự động tặng khi thăng lên hạng Kim Cương: Giảm 30% (tối đa 400.000đ) cho đơn từ 800.000đ',
        discountType: 'percent',
        discountValue: 30,
        maxDiscount: 400000,
        minOrderValue: 800000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 0,
        perUserLimit: 1,
        startDate: now,
        endDate: null,
        minRank: null,
        forNewUsers: false,
        autoGrantOnRank: 'Kim Cương',
        status: 'active'
      },
      {
        code: 'AUTO_LEGEND',
        title: 'Quà Thăng Hạng Huyền Thoại',
        description: 'Voucher tri ân tự động tặng khi thăng lên hạng Huyền Thoại: Giảm 40% (tối đa 600.000đ) cho đơn từ 1.000.000đ',
        discountType: 'percent',
        discountValue: 40,
        maxDiscount: 600000,
        minOrderValue: 1000000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 0,
        perUserLimit: 1,
        startDate: now,
        endDate: null,
        minRank: null,
        forNewUsers: false,
        autoGrantOnRank: 'Huyền Thoại',
        status: 'active'
      }
    ];

    vouchersToInsert.push(...rankUpTemplates);

    // 4. Tìm kiếm các BusinessAccount có sẵn trong database để tạo thêm Voucher cho họ
    console.log('🔍 Đang quét danh sách Doanh nghiệp đối tác trong database...');
    const businesses = await BusinessAccount.find({ status: 'active' });
    console.log(`🏢 Tìm thấy ${businesses.length} đối tác hoạt động.`);

    // Hardcode fallback doanh nghiệp mặc định nếu DB trống
    if (businesses.length === 0) {
      console.log('⚠️ Không tìm thấy đối tác nào hoạt động, bỏ qua phần tạo voucher đối tác động.');
    } else {
      for (const biz of businesses) {
        const ownerId = biz.customId || biz._id.toString();
        const ownerName = biz.displayName || biz.name;
        const shortName = ownerName.replace(/Resort|Hotel|Luxury|Spa|Restaurant|Viet/gi, '').trim().toUpperCase().replace(/\s+/g, '');

        // Tìm các địa điểm (Places) thuộc quyền sở hữu của doanh nghiệp này
        const bizPlaces = await Place.find({ ownerId: ownerId });
        const placeIds = bizPlaces.map(p => p.id || p._id.toString());

        // 4.1. Tạo Voucher áp dụng cho toàn bộ dịch vụ của Doanh nghiệp
        vouchersToInsert.push({
          code: `${shortName}ALL10`,
          title: `Ưu Đãi 10% tại ${ownerName}`,
          description: `Giảm giá 10% tối đa 100.000đ áp dụng cho mọi dịch vụ thuộc hệ thống ${ownerName}`,
          discountType: 'percent',
          discountValue: 10,
          maxDiscount: 100000,
          minOrderValue: 300000,
          createdBy: 'business',
          ownerId: ownerId,
          ownerName: ownerName,
          scope: 'all',
          totalLimit: 500,
          perUserLimit: 2,
          startDate: now,
          endDate: futureDate,
          minRank: null,
          forNewUsers: false,
          status: 'active'
        });

        // 4.2. Nếu doanh nghiệp có các địa điểm cụ thể, tạo thêm voucher cụ thể cho dịch vụ đó
        if (placeIds.length > 0) {
          const firstPlaceName = bizPlaces[0].name;
          const placeShortName = firstPlaceName.replace(/VinWonders|SunWorld|Hotel|Resort/gi, '').trim().toUpperCase().slice(0, 5).replace(/\s+/g, '');
          
          vouchersToInsert.push({
            code: `${placeShortName}VIP20`,
            title: `Ưu Đãi Trải Nghiệm ${firstPlaceName}`,
            description: `Mã giảm giá cực khủng trị giá 200.000đ dành cho gói dịch vụ/trải nghiệm đặc biệt tại ${firstPlaceName}`,
            discountType: 'fixed',
            discountValue: 200000,
            minOrderValue: 1000000,
            createdBy: 'business',
            ownerId: ownerId,
            ownerName: ownerName,
            scope: 'specific_services',
            applicablePlaces: placeIds,
            totalLimit: 100,
            perUserLimit: 1,
            startDate: now,
            endDate: futureDate,
            minRank: null,
            forNewUsers: false,
            status: 'active'
          });
        }
      }
    }

    // 5. Lưu toàn bộ danh sách vào database
    console.log(`💾 Đang lưu ${vouchersToInsert.length} mã giảm giá vào Database...`);
    const inserted = await Voucher.insertMany(vouchersToInsert);
    console.log(`🎉 THÀNH CÔNG! Đã khởi tạo ${inserted.length} mã giảm giá.`);
    
    console.log('\n📋 Danh sách mã giảm giá đã nạp:');
    inserted.forEach(v => {
      console.log(` - Mã: [${v.code}] | Hạng tối thiểu: ${v.minRank || 'Tất cả'} | Auto-grant rank: ${v.autoGrantOnRank || 'Không'} | Sở hữu: ${v.ownerName}`);
    });

  } catch (err) {
    console.error('❌ Lỗi trong quá trình khởi tạo dữ liệu mã giảm giá:', err);
  } finally {
    mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối cơ sở dữ liệu.');
    process.exit(0);
  }
}

seedVouchers();
