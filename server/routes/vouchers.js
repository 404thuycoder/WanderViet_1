const express = require('express');
const router = express.Router();
const Voucher = require('../models/Voucher');
const VoucherUsage = require('../models/VoucherUsage');
const User = require('../models/User');
const { auth, businessAuth, sharedAuth } = require('./auth');

// ════════════════════════════════════════════════════════════════
//  ADMIN: CRUD Vouchers (toàn sàn)
// ════════════════════════════════════════════════════════════════

// GET /api/vouchers/admin — Lấy tất cả voucher (admin)
router.get('/admin', sharedAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }
    const vouchers = await Voucher.find().sort({ createdAt: -1 });
    res.json({ success: true, data: vouchers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/vouchers/admin — Admin tạo voucher mới
router.post('/admin', sharedAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }

    const {
      code, title, description, discountType, discountValue,
      maxDiscount, minOrderValue, totalLimit, perUserLimit,
      startDate, endDate, minRank, forNewUsers, autoGrantOnRank
    } = req.body;

    if (!code || !title || !discountType || discountValue === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (code, title, discountType, discountValue)' });
    }

    // Check trùng mã
    const existing = await Voucher.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Mã "${code}" đã tồn tại trong hệ thống` });
    }

    const voucher = new Voucher({
      code: code.toUpperCase(),
      title,
      description: description || '',
      discountType,
      discountValue: Number(discountValue),
      maxDiscount: Number(maxDiscount || 0),
      minOrderValue: Number(minOrderValue || 0),
      createdBy: 'admin',
      ownerId: req.user.id,
      ownerName: 'WanderViệt',
      scope: 'all',
      totalLimit: Number(totalLimit || 0),
      perUserLimit: Number(perUserLimit || 1),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      minRank: minRank || null,
      forNewUsers: forNewUsers || false,
      autoGrantOnRank: autoGrantOnRank || null,
      status: 'active'
    });

    await voucher.save();
    res.json({ success: true, data: voucher, message: `Đã tạo mã "${voucher.code}" thành công` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/vouchers/admin/:id — Admin sửa voucher
router.put('/admin/:id', sharedAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }

    const updates = {};
    const allowedFields = [
      'title', 'description', 'discountType', 'discountValue',
      'maxDiscount', 'minOrderValue', 'totalLimit', 'perUserLimit',
      'startDate', 'endDate', 'minRank', 'status', 'forNewUsers', 'autoGrantOnRank'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (['discountValue', 'maxDiscount', 'minOrderValue', 'totalLimit', 'perUserLimit'].includes(field)) {
          updates[field] = Number(req.body[field]);
        } else if (['startDate', 'endDate'].includes(field)) {
          updates[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const voucher = await Voucher.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' });
    if (!voucher) return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });

    res.json({ success: true, data: voucher, message: 'Đã cập nhật voucher' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/vouchers/admin/:id — Admin xóa voucher
router.delete('/admin/:id', sharedAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }

    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });

    res.json({ success: true, message: `Đã xóa mã "${voucher.code}"` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ════════════════════════════════════════════════════════════════
//  BUSINESS: CRUD Vouchers (cho doanh nghiệp)
// ════════════════════════════════════════════════════════════════

// GET /api/vouchers/business — Lấy voucher của doanh nghiệp hiện tại
router.get('/business', businessAuth, async (req, res) => {
  try {
    const vouchers = await Voucher.find({ createdBy: 'business', ownerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: vouchers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/vouchers/business — Business tạo voucher mới
router.post('/business', businessAuth, async (req, res) => {
  try {
    const {
      code, title, description, discountType, discountValue,
      maxDiscount, minOrderValue, totalLimit, perUserLimit,
      startDate, endDate, scope, applicablePlaces
    } = req.body;

    if (!code || !title || !discountType || discountValue === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    // Check trùng mã toàn hệ thống
    const existing = await Voucher.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Mã "${code}" đã tồn tại` });
    }

    // Lấy tên doanh nghiệp
    const BusinessAccount = require('../models/BusinessAccount');
    const biz = await BusinessAccount.findById(req.user.id).select('name displayName');
    const bizName = biz ? (biz.displayName || biz.name) : 'Doanh nghiệp';

    const voucher = new Voucher({
      code: code.toUpperCase(),
      title,
      description: description || '',
      discountType,
      discountValue: Number(discountValue),
      maxDiscount: Number(maxDiscount || 0),
      minOrderValue: Number(minOrderValue || 0),
      createdBy: 'business',
      ownerId: req.user.id,
      ownerName: bizName,
      scope: scope || 'all',
      applicablePlaces: applicablePlaces || [],
      totalLimit: Number(totalLimit || 0),
      perUserLimit: Number(perUserLimit || 1),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      status: 'active'
    });

    await voucher.save();
    res.json({ success: true, data: voucher, message: `Đã tạo mã "${voucher.code}"` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/vouchers/business/:id — Business sửa voucher
router.put('/business/:id', businessAuth, async (req, res) => {
  try {
    const voucher = await Voucher.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!voucher) return res.status(404).json({ success: false, message: 'Không tìm thấy hoặc không có quyền' });

    const allowedFields = [
      'title', 'description', 'discountType', 'discountValue',
      'maxDiscount', 'minOrderValue', 'totalLimit', 'perUserLimit',
      'startDate', 'endDate', 'status', 'scope', 'applicablePlaces'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (['discountValue', 'maxDiscount', 'minOrderValue', 'totalLimit', 'perUserLimit'].includes(field)) {
          voucher[field] = Number(req.body[field]);
        } else if (['startDate', 'endDate'].includes(field)) {
          voucher[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          voucher[field] = req.body[field];
        }
      }
    }

    await voucher.save();
    res.json({ success: true, data: voucher, message: 'Đã cập nhật' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/vouchers/business/:id — Business xóa voucher
router.delete('/business/:id', businessAuth, async (req, res) => {
  try {
    const voucher = await Voucher.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!voucher) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, message: `Đã xóa mã "${voucher.code}"` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ════════════════════════════════════════════════════════════════
//  USER: Xem & Áp dụng voucher
// ════════════════════════════════════════════════════════════════

// GET /api/vouchers/available?placeId=xxx — Lấy voucher khả dụng cho user tại 1 dịch vụ
router.get('/available', auth, async (req, res) => {
  try {
    const { placeId } = req.query;
    const now = new Date();
    const userId = req.user.id;
    const userQuery = { $or: [{ customId: userId }] };
    if (require('mongoose').Types.ObjectId.isValid(userId)) userQuery.$or.push({ _id: userId });
    const user = await User.findOne(userQuery).select('rank points createdAt');
    if (!user) return res.status(401).json({ success: false, message: 'Không tìm thấy người dùng' });

    // Tìm voucher đang active, chưa hết hạn
    const query = {
      status: 'active',
      $or: [{ startDate: { $lte: now } }, { startDate: null }],
      $and: [
        { $or: [{ endDate: { $gte: now } }, { endDate: null }] }
      ],
      recipientId: { $in: [null, req.user.id] }
    };

    const allVouchers = await Voucher.find(query).sort({ createdAt: -1 }).lean();

    // Lấy lịch sử dùng của user
    const usages = await VoucherUsage.find({ userId: req.user.id }).lean();
    const usageMap = {};
    usages.forEach(u => {
      usageMap[u.voucherId.toString()] = (usageMap[u.voucherId.toString()] || 0) + 1;
    });

    // Rank hierarchy
    const RANK_ORDER = ['Đồng', 'Bạc', 'Vàng', 'Bạch Kim', 'Kim Cương', 'Huyền Thoại'];
    const userRankIdx = RANK_ORDER.indexOf(user.rank || 'Đồng');

    // Filter
    const available = allVouchers.filter(v => {
      // Check số lượng tổng
      if (v.totalLimit > 0 && v.usedCount >= v.totalLimit) return false;

      // Check per-user limit
      const userUsed = usageMap[v._id.toString()] || 0;
      if (userUsed >= v.perUserLimit) return false;

      // Check rank requirement
      if (v.minRank) {
        const reqIdx = RANK_ORDER.indexOf(v.minRank);
        if (userRankIdx < reqIdx) return false;
      }

      // Check forNewUsers (chỉ user tạo trong 7 ngày gần)
      if (v.forNewUsers) {
        const daysSinceJoin = (now - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceJoin > 7) return false;
      }

      // Check scope nếu có placeId
      if (placeId && v.createdBy === 'business') {
        if (v.scope === 'specific_services' && v.applicablePlaces.length > 0) {
          if (!v.applicablePlaces.includes(placeId)) return false;
        }
      }

      return true;
    });

    res.json({ success: true, data: available });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/vouchers/apply — Áp dụng voucher (kiểm tra & tính toán)
router.post('/apply', auth, async (req, res) => {
  try {
    const { code, placeId, orderTotal } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });

    const voucher = await Voucher.findOne({ code: code.toUpperCase(), status: 'active' });
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' });
    }

    if (voucher.recipientId && voucher.recipientId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Mã giảm giá này không dành cho tài khoản của bạn' });
    }

    const now = new Date();

    // Check thời hạn
    if (voucher.startDate && now < voucher.startDate) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá chưa có hiệu lực' });
    }
    if (voucher.endDate && now > voucher.endDate) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' });
    }

    // Check số lượng
    if (voucher.totalLimit > 0 && voucher.usedCount >= voucher.totalLimit) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
    }

    // Check per-user limit
    const userUsed = await VoucherUsage.countDocuments({ voucherId: voucher._id, userId: req.user.id });
    if (userUsed >= voucher.perUserLimit) {
      return res.status(400).json({ success: false, message: 'Bạn đã sử dụng mã này rồi' });
    }

    // Check rank
    if (voucher.minRank) {
      const uid = req.user.id;
      const uq = { $or: [{ customId: uid }] };
      if (require('mongoose').Types.ObjectId.isValid(uid)) uq.$or.push({ _id: uid });
      const user = await User.findOne(uq).select('rank');
      const RANK_ORDER = ['Đồng', 'Bạc', 'Vàng', 'Bạch Kim', 'Kim Cương', 'Huyền Thoại'];
      const userIdx = RANK_ORDER.indexOf(user?.rank || 'Đồng');
      const reqIdx = RANK_ORDER.indexOf(voucher.minRank);
      if (userIdx < reqIdx) {
        return res.status(400).json({ success: false, message: `Mã này chỉ dành cho hạng ${voucher.minRank} trở lên` });
      }
    }

    // Check đơn tối thiểu
    const total = Number(orderTotal || 0);
    if (voucher.minOrderValue > 0 && total < voucher.minOrderValue) {
      return res.status(400).json({ 
        success: false, 
        message: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}đ để sử dụng mã này` 
      });
    }

    // Check scope (business voucher cho dịch vụ cụ thể)
    if (placeId && voucher.createdBy === 'business' && voucher.scope === 'specific_services') {
      if (voucher.applicablePlaces.length > 0 && !voucher.applicablePlaces.includes(placeId)) {
        return res.status(400).json({ success: false, message: 'Mã không áp dụng cho dịch vụ này' });
      }
    }

    // Tính số tiền giảm
    let discountAmount = 0;
    if (voucher.discountType === 'percent') {
      discountAmount = Math.round(total * voucher.discountValue / 100);
      if (voucher.maxDiscount > 0 && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    } else {
      discountAmount = voucher.discountValue;
    }

    // Không được giảm quá tổng đơn
    if (discountAmount > total) discountAmount = total;

    res.json({
      success: true,
      data: {
        voucher: {
          _id: voucher._id,
          code: voucher.code,
          title: voucher.title,
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
          maxDiscount: voucher.maxDiscount,
          ownerName: voucher.ownerName
        },
        discountAmount,
        finalPrice: total - discountAmount
      },
      message: `Áp dụng mã "${voucher.code}" thành công! Giảm ${discountAmount.toLocaleString('vi-VN')}đ`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/vouchers/use — Xác nhận sử dụng voucher (gọi khi thanh toán thành công)
router.post('/use', auth, async (req, res) => {
  try {
    const { voucherId, bookingId, discountAmount, originalPrice } = req.body;
    if (!voucherId) return res.status(400).json({ success: false, message: 'Thiếu voucherId' });

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) return res.status(404).json({ success: false, message: 'Voucher không tồn tại' });

    // Tăng usedCount
    voucher.usedCount += 1;
    if (voucher.totalLimit > 0 && voucher.usedCount >= voucher.totalLimit) {
      voucher.status = 'expired';
    }
    await voucher.save();

    // Lưu usage
    const usage = new VoucherUsage({
      voucherId: voucher._id,
      voucherCode: voucher.code,
      userId: req.user.id,
      bookingId: bookingId || null,
      discountAmount: Number(discountAmount || 0),
      originalPrice: Number(originalPrice || 0)
    });
    await usage.save();

    res.json({ success: true, message: 'Đã ghi nhận sử dụng voucher' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vouchers/business/stats — Thống kê voucher cho business
router.get('/business/stats', businessAuth, async (req, res) => {
  try {
    const vouchers = await Voucher.find({ createdBy: 'business', ownerId: req.user.id }).lean();
    const voucherIds = vouchers.map(v => v._id);
    
    const usages = await VoucherUsage.find({ voucherId: { $in: voucherIds } }).lean();
    
    const totalDiscountGiven = usages.reduce((sum, u) => sum + (u.discountAmount || 0), 0);
    const totalUsages = usages.length;
    const activeCount = vouchers.filter(v => v.status === 'active').length;

    res.json({
      success: true,
      data: {
        totalVouchers: vouchers.length,
        activeCount,
        totalUsages,
        totalDiscountGiven
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vouchers/for-place/:placeId — Public: Lấy voucher hiển thị cho 1 dịch vụ
router.get('/for-place/:placeId', async (req, res) => {
  try {
    const now = new Date();
    const Place = require('../models/Place');
    const place = await Place.findOne({ $or: [{ id: req.params.placeId }, { _id: req.params.placeId }] }).select('ownerId');
    
    if (!place) return res.json({ success: true, data: [] });

    const vouchers = await Voucher.find({
      status: 'active',
      $or: [
        // Admin vouchers (toàn sàn)
        { createdBy: 'admin' },
        // Business vouchers cho tất cả dịch vụ của business đó
        { createdBy: 'business', ownerId: place.ownerId, scope: 'all' },
        // Business vouchers chỉ định cụ thể dịch vụ này
        { createdBy: 'business', ownerId: place.ownerId, scope: 'specific_services', applicablePlaces: req.params.placeId }
      ],
      $and: [
        { $or: [{ startDate: { $lte: now } }, { startDate: null }] },
        { $or: [{ endDate: { $gte: now } }, { endDate: null }] }
      ]
    }).select('code title discountType discountValue maxDiscount minOrderValue ownerName createdBy minRank forNewUsers').lean();

    // Filter out vouchers that hit their limit
    const available = vouchers.filter(v => {
      if (v.totalLimit > 0 && v.usedCount >= v.totalLimit) return false;
      return true;
    });

    res.json({ success: true, data: available });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
