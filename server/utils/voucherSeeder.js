/**
 * voucherSeeder.js — Tiện ích tự động hoặc thủ công nạp dữ liệu mã giảm giá (Vouchers)
 */
const Voucher = require('../models/Voucher');
const BusinessAccount = require('../models/BusinessAccount');
const Place = require('../models/Place');

/**
 * Seed default vouchers into MongoDB
 * @param {boolean} force - Nếu true, xóa sạch vouchers cũ trước khi nạp lại
 */
async function seedDefaultVouchers(force = false) {
  try {
    const count = await Voucher.countDocuments();
    if (count > 0 && !force) {
      console.log(`[VoucherSeeder] Đã có sẵn ${count} mã giảm giá trong database. Bỏ qua auto-seed.`);
      return { success: true, message: 'Vouchers already exist, skipped auto-seed.' };
    }

    console.log('[VoucherSeeder] Bắt đầu khởi tạo dữ liệu mã giảm giá...');
    
    if (force) {
      console.log('[VoucherSeeder] Đang xóa sạch dữ liệu vouchers cũ...');
      await Voucher.deleteMany({});
    }

    const vouchersToInsert = [];
    const now = new Date();
    // Hạn sử dụng mặc định: 1 năm từ lúc khởi tạo
    const futureDate = new Date();
    futureDate.setFullYear(now.getFullYear() + 1);

    // 1. Mã giảm giá Admin toàn hệ thống (toàn sàn & vận chuyển)
    const adminVouchers = [
      // === WANDERVIET PLATFORM VOUCHERS ===
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
        code: 'WANDEREXPLORE',
        title: 'Du Ngoạn Muôn Phương',
        description: 'Voucher trải nghiệm dịch vụ: Giảm 12% (tối đa 60.000đ) cho đơn hàng từ 200.000đ',
        discountType: 'percent',
        discountValue: 12,
        maxDiscount: 60000,
        minOrderValue: 200000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 3000,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDERWEEKEND',
        title: 'Cuối Tuần Rực Rỡ',
        description: 'Ưu đãi cuối tuần: Giảm 15% (tối đa 100.000đ) cho hóa đơn từ 250.000đ',
        discountType: 'percent',
        discountValue: 15,
        maxDiscount: 100000,
        minOrderValue: 250000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 2000,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDERSUMMER',
        title: 'Chào Hè Rực Rỡ',
        description: 'Voucher mùa hè: Giảm 20% (tối đa 150.000đ) cho hóa đơn từ 400.000đ',
        discountType: 'percent',
        discountValue: 20,
        maxDiscount: 150000,
        minOrderValue: 400000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 1500,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDERAUTUMN',
        title: 'Thu Vàng Lãng Mạn',
        description: 'Voucher mùa thu: Giảm 15% (tối đa 80.000đ) cho hóa đơn từ 300.000đ',
        discountType: 'percent',
        discountValue: 15,
        maxDiscount: 80000,
        minOrderValue: 300000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 2000,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDERHOLIDAY',
        title: 'Lễ Hội Rực Rỡ',
        description: 'Siêu voucher ngày lễ: Giảm 20% (tối đa 180.000đ) cho hóa đơn từ 500.000đ',
        discountType: 'percent',
        discountValue: 20,
        maxDiscount: 180000,
        minOrderValue: 500000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 1000,
        perUserLimit: 1,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDER30K',
        title: 'Trải Nghiệm Tiết Kiệm',
        description: 'Giảm thẳng 30.000đ cho mọi đơn hàng có giá trị từ 150.000đ',
        discountType: 'fixed',
        discountValue: 30000,
        minOrderValue: 150000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 3000,
        perUserLimit: 3,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDER50K',
        title: 'Hành Trình Khám Phá',
        description: 'Giảm thẳng 50.000đ cho mọi đơn hàng có giá trị từ 300.000đ',
        discountType: 'fixed',
        discountValue: 50000,
        minOrderValue: 300000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 2000,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDER100K',
        title: 'Du Ngoạn Sang Chảnh',
        description: 'Giảm thẳng 100.000đ cho mọi đơn hàng có giá trị từ 600.000đ',
        discountType: 'fixed',
        discountValue: 100000,
        minOrderValue: 600000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 1000,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDER200K',
        title: 'Siêu Cấp Khám Phá',
        description: 'Giảm thẳng 200.000đ cho mọi đơn hàng có giá trị từ 1.200.000đ',
        discountType: 'fixed',
        discountValue: 200000,
        minOrderValue: 1200000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 500,
        perUserLimit: 1,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDERFLASH50',
        title: 'Flash Sale Giờ Vàng',
        description: 'Mã giảm giá chớp nhoáng: Giảm 50% (tối đa 50.000đ) áp dụng cho mọi đơn hàng',
        discountType: 'percent',
        discountValue: 50,
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
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'WANDERCHILL',
        title: 'Thư Giãn Cuối Ngày',
        description: 'Voucher thư giãn: Giảm 10% (tối đa 40.000đ) áp dụng từ 18:00 - 23:00 hàng ngày',
        discountType: 'percent',
        discountValue: 10,
        maxDiscount: 40000,
        minOrderValue: 100000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 1500,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: false,
        status: 'active'
      },

      // === FREE SHIPPING / TRANSIT VOUCHERS ===
      {
        code: 'WANDERSHIP',
        title: 'Miễn Phí Vận Chuyển',
        description: 'Voucher hỗ trợ di chuyển du lịch toàn sàn: Giảm 100% phí di chuyển/đưa đón tối đa 30.000đ',
        discountType: 'percent',
        discountValue: 100,
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
        code: 'SHIPFREE50',
        title: 'Hỗ Trợ Di Chuyển VIP',
        description: 'Miễn phí di chuyển: Giảm 100% phí đưa đón/thuê xe tối đa 50.000đ cho đơn hàng từ 250.000đ',
        discountType: 'percent',
        discountValue: 100,
        maxDiscount: 50000,
        minOrderValue: 250000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 3000,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'SHIPFAST20',
        title: 'Đồng Hành Đường Xa',
        description: 'Giảm thẳng 20.000đ phí vận chuyển/di chuyển cho mọi hóa đơn',
        discountType: 'fixed',
        discountValue: 20000,
        minOrderValue: 50000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 4000,
        perUserLimit: 3,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'SHIPCHILL',
        title: 'Vận Chuyển Êm Ái',
        description: 'Giảm 15.000đ phí đưa đón áp dụng cho các hành trình ngắn từ 80.000đ',
        discountType: 'fixed',
        discountValue: 15000,
        minOrderValue: 80000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 2500,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: null,
        forNewUsers: false,
        status: 'active'
      },

      // === MEMBER RANK VOUCHERS (STATIC ELIGIBILITY) ===
      // HẠNG ĐỒNG
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
        code: 'BRONZEGIFT',
        title: 'Quà Chào Mừng Hạng Đồng',
        description: 'Món quà ra mắt thành viên hạng Đồng: Giảm 12% (tối đa 40.000đ) cho đơn từ 100.000đ',
        discountType: 'percent',
        discountValue: 12,
        maxDiscount: 40000,
        minOrderValue: 100000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 2000,
        perUserLimit: 1,
        startDate: now,
        endDate: futureDate,
        minRank: 'Đồng',
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'BRONZE_SPECIAL',
        title: 'Đặc Quyền Đồng Hành',
        description: 'Ưu đãi đặc biệt hạng Đồng: Giảm thẳng 15.000đ cho đơn hàng từ 120.000đ',
        discountType: 'fixed',
        discountValue: 15000,
        minOrderValue: 120000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 1500,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: 'Đồng',
        forNewUsers: false,
        status: 'active'
      },
      // HẠNG BẠC
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
        code: 'SILVERGIFT',
        title: 'Quà Tặng Thành Viên Bạc',
        description: 'Voucher quà tặng sinh nhật/tri ân hạng Bạc: Giảm thẳng 25.000đ cho đơn từ 180.000đ',
        discountType: 'fixed',
        discountValue: 25000,
        minOrderValue: 180000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 1500,
        perUserLimit: 1,
        startDate: now,
        endDate: futureDate,
        minRank: 'Bạc',
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'SILVER_ELITE',
        title: 'Đặc Quyền Bạc Cao Cấp',
        description: 'Ưu đãi Bạc tinh hoa: Giảm 18% (tối đa 90.000đ) áp dụng cho đơn từ 250.000đ',
        discountType: 'percent',
        discountValue: 18,
        maxDiscount: 90000,
        minOrderValue: 250000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 1000,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: 'Bạc',
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'SHIPVIP50',
        title: 'Siêu Phí Vận Chuyển VIP',
        description: 'Voucher đưa đón VIP: Giảm 50% phí di chuyển tối đa 100.000đ dành cho thành viên Bạc trở lên',
        discountType: 'percent',
        discountValue: 50,
        maxDiscount: 100000,
        minOrderValue: 300000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 2000,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: 'Bạc',
        forNewUsers: false,
        status: 'active'
      },
      // HẠNG VÀNG
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
        code: 'GOLDGIFT',
        title: 'Quà Tặng Tri Ân Hạng Vàng',
        description: 'Voucher chúc mừng thăng hạng Vàng: Giảm thẳng 50.000đ cho đơn hàng từ 250.000đ',
        discountType: 'fixed',
        discountValue: 50000,
        minOrderValue: 250000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 1000,
        perUserLimit: 1,
        startDate: now,
        endDate: futureDate,
        minRank: 'Vàng',
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'GOLD_PREMIUM',
        title: 'Đặc Quyền Vàng Thượng Hạng',
        description: 'Ưu đãi cao cấp hạng Vàng: Giảm 22% (tối đa 160.000đ) cho hóa đơn từ 400.000đ',
        discountType: 'percent',
        discountValue: 22,
        maxDiscount: 160000,
        minOrderValue: 400000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 800,
        perUserLimit: 3,
        startDate: now,
        endDate: futureDate,
        minRank: 'Vàng',
        forNewUsers: false,
        status: 'active'
      },
      // HẠNG BẠCH KIM
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
        code: 'PLATINUMGIFT',
        title: 'Quà Tặng Thượng Lưu Bạch Kim',
        description: 'Voucher đặc quyền Bạch Kim: Giảm thẳng 100.000đ cho đơn hàng từ 450.000đ',
        discountType: 'fixed',
        discountValue: 100000,
        minOrderValue: 450000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 800,
        perUserLimit: 1,
        startDate: now,
        endDate: futureDate,
        minRank: 'Bạch Kim',
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'PLATINUM_ELITE',
        title: 'Bạch Kim Tinh Anh',
        description: 'Ưu đãi siêu cấp hạng Bạch Kim: Giảm 28% (tối đa 280.000đ) cho hóa đơn từ 700.000đ',
        discountType: 'percent',
        discountValue: 28,
        maxDiscount: 280000,
        minOrderValue: 700000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 600,
        perUserLimit: 3,
        startDate: now,
        endDate: futureDate,
        minRank: 'Bạch Kim',
        forNewUsers: false,
        status: 'active'
      },
      // HẠNG KIM CƯƠNG
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
        code: 'DIAMONDGIFT',
        title: 'Quà Tặng Hoàng Gia Kim Cương',
        description: 'Quà tặng vinh danh hạng Kim Cương: Giảm thẳng 200.000đ cho đơn hàng từ 700.000đ',
        discountType: 'fixed',
        discountValue: 200000,
        minOrderValue: 700000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 500,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: 'Kim Cương',
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'DIAMOND_ROYAL',
        title: 'Kim Cương Hoàng Gia',
        description: 'Ưu đãi hoàng gia tối thượng: Giảm 35% (tối đa 450.000đ) cho đơn hàng từ 1.000.000đ',
        discountType: 'percent',
        discountValue: 35,
        maxDiscount: 450000,
        minOrderValue: 1000000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 400,
        perUserLimit: 3,
        startDate: now,
        endDate: futureDate,
        minRank: 'Kim Cương',
        forNewUsers: false,
        status: 'active'
      },
      // HẠNG HUYỀN THOẠI
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
      },
      {
        code: 'LEGENDGIFT',
        title: 'Quà Tặng Vô Song Huyền Thoại',
        description: 'Tuyệt phẩm tri ân dành riêng cho hạng Huyền Thoại: Giảm thẳng 400.000đ cho đơn hàng từ 1.200.000đ',
        discountType: 'fixed',
        discountValue: 400000,
        minOrderValue: 1200000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 200,
        perUserLimit: 2,
        startDate: now,
        endDate: futureDate,
        minRank: 'Huyền Thoại',
        forNewUsers: false,
        status: 'active'
      },
      {
        code: 'LEGEND_ULTIMATE',
        title: 'Huyền Thoại Bất Tử',
        description: 'Voucher đỉnh phong tối cao: Giảm 50% (tối đa 800.000đ) cho đơn hàng từ 1.500.000đ',
        discountType: 'percent',
        discountValue: 50,
        maxDiscount: 800000,
        minOrderValue: 1500000,
        createdBy: 'admin',
        ownerId: 'admin',
        ownerName: 'WanderViet AI',
        scope: 'all',
        totalLimit: 100,
        perUserLimit: 5,
        startDate: now,
        endDate: futureDate,
        minRank: 'Huyền Thoại',
        forNewUsers: false,
        status: 'active'
      }
    ];

    vouchersToInsert.push(...adminVouchers);

    // 2. Mẫu vouchers thăng hạng tự động (Auto Grant Rank Up Templates)
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

    // Lọc trùng lặp mã bằng in-memory Set
    const addedCodes = new Set();
    const uniqueVouchers = [];

    // Nạp vouchers admin
    for (const v of adminVouchers) {
      if (!addedCodes.has(v.code)) {
        addedCodes.add(v.code);
        uniqueVouchers.push(v);
      }
    }

    // Nạp templates rank up
    for (const v of rankUpTemplates) {
      if (!addedCodes.has(v.code)) {
        addedCodes.add(v.code);
        uniqueVouchers.push(v);
      }
    }

    // 3. Quét các đối tác Doanh nghiệp trong DB để tạo voucher đối tác
    try {
      const businesses = await BusinessAccount.find({ status: 'active' });
      for (const biz of businesses) {
        const ownerId = biz.customId || biz._id.toString();
        const ownerName = biz.displayName || biz.name;
        // Rút gọn tên doanh nghiệp viết liền để làm tiền tố cho code
        const shortName = ownerName.replace(/Resort|Hotel|Luxury|Spa|Restaurant|Viet/gi, '').trim().toUpperCase().replace(/\s+/g, '');
        const codePrefix = shortName.length >= 3 ? shortName.slice(0, 5) : 'PARTNER';

        const bizPlaces = await Place.find({ ownerId: ownerId });
        const placeIds = bizPlaces.map(p => p.id || p._id.toString());

        // Mã giảm giá cho toàn bộ dịch vụ của đối tác
        let code = `${codePrefix}ALL10`;
        let suffix = 1;
        while (addedCodes.has(code)) {
          code = `${codePrefix}ALL10_${suffix++}`;
        }
        addedCodes.add(code);

        uniqueVouchers.push({
          code: code,
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

        // Mã giảm giá cho dịch vụ cụ thể
        if (placeIds.length > 0) {
          const firstPlace = bizPlaces[0];
          const nameSafe = firstPlace.name || 'VIP';
          let placeCode = nameSafe.replace(/VinWonders|SunWorld|Hotel|Resort/gi, '').trim().toUpperCase().slice(0, 5).replace(/\s+/g, '');
          if (!placeCode) placeCode = 'VIP';

          let pCode = `${placeCode}VIP20`;
          let pSuffix = 1;
          while (addedCodes.has(pCode)) {
            pCode = `${placeCode}VIP20_${pSuffix++}`;
          }
          addedCodes.add(pCode);

          uniqueVouchers.push({
            code: pCode,
            title: `Ưu Đãi Trải Nghiệm ${firstPlace.name}`,
            description: `Mã giảm giá đặc biệt trị giá 200.000đ dành riêng cho các dịch vụ tại ${firstPlace.name}`,
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
    } catch (bizErr) {
      console.warn('[VoucherSeeder] Không thể lấy danh sách đối tác để tạo mã động:', bizErr.message);
    }

    let insertedCount = 0;
    try {
      // Sử dụng ordered: false để bỏ qua các lỗi trùng lặp nếu có mà không làm gián đoạn chèn các bản ghi khác
      const inserted = await Voucher.insertMany(uniqueVouchers, { ordered: false });
      insertedCount = inserted.length;
      console.log(`[VoucherSeeder] Đã khởi tạo thành công ${insertedCount} mã giảm giá.`);
    } catch (insertErr) {
      // Bắt lỗi trùng lặp (11000) và tính lại số lượng thực tế đã nạp
      if (insertErr.code === 11000 || (insertErr.writeErrors && insertErr.writeErrors.length > 0)) {
        insertedCount = await Voucher.countDocuments();
        console.log(`[VoucherSeeder] Hoàn tất nạp dữ liệu (một số mã trùng lặp bị bỏ qua). Tổng số trong DB: ${insertedCount}`);
      } else {
        throw insertErr;
      }
    }

    const finalCount = await Voucher.countDocuments();
    return { 
      success: true, 
      message: `Đã nạp thành công các mã giảm giá vào cơ sở dữ liệu.`, 
      totalInDb: finalCount 
    };

  } catch (err) {
    console.error('[VoucherSeeder] Lỗi trong quá trình khởi tạo dữ liệu:', err);
    throw err;
  }
}

module.exports = {
  seedDefaultVouchers
};

