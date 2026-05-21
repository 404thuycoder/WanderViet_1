const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  // Mã voucher (duy nhất, viết hoa)
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  
  // Tên chương trình
  title: { type: String, required: true },
  description: { type: String, default: '' },

  // Loại giảm giá: 'percent' hoặc 'fixed'
  discountType: { type: String, enum: ['percent', 'fixed'], required: true },
  
  // Giá trị giảm (VD: 10 = 10% hoặc 50000 = 50.000đ)
  discountValue: { type: Number, required: true },
  
  // Giảm tối đa (chỉ áp dụng khi discountType = 'percent')
  maxDiscount: { type: Number, default: 0 },
  
  // Đơn hàng tối thiểu để áp dụng
  minOrderValue: { type: Number, default: 0 },

  // Ai tạo: 'admin' (toàn sàn) hoặc 'business' (riêng doanh nghiệp)
  createdBy: { type: String, enum: ['admin', 'business'], required: true },
  
  // ID của người tạo (admin ID hoặc business ID)
  ownerId: { type: String, required: true },
  
  // Tên doanh nghiệp (nếu business tạo, để hiển thị)
  ownerName: { type: String, default: '' },

  // Phạm vi áp dụng
  scope: { 
    type: String, 
    enum: ['all', 'specific_services'], // all = tất cả dịch vụ của owner, specific = chỉ một số
    default: 'all' 
  },
  
  // Danh sách placeId được áp dụng (nếu scope = 'specific_services')
  applicablePlaces: [{ type: String }],

  // Giới hạn rank tối thiểu để sử dụng (null = không giới hạn)
  minRank: { type: String, enum: ['Đồng', 'Bạc', 'Vàng', 'Bạch Kim', 'Kim Cương', 'Huyền Thoại', null], default: null },

  // Số lượng tối đa & đã dùng
  totalLimit: { type: Number, default: 0 }, // 0 = unlimited
  usedCount: { type: Number, default: 0 },
  
  // Giới hạn số lần 1 user được dùng
  perUserLimit: { type: Number, default: 1 },

  // Thời hạn
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: null }, // null = không hết hạn

  // Trạng thái
  status: { type: String, enum: ['active', 'paused', 'expired'], default: 'active' },
  
  // Dành cho khách hàng mới?
  forNewUsers: { type: Boolean, default: false },
  
  // Tự động cấp khi lên hạng?
  autoGrantOnRank: { type: String, default: null }, // VD: 'Bạc' = tự cấp khi user lên hạng Bạc

  // Người nhận nếu là voucher cá nhân (null = công khai)
  recipientId: { type: String, default: null },

  createdAt: { type: Date, default: Date.now }
});

// Index để tìm kiếm nhanh
voucherSchema.index({ code: 1 });
voucherSchema.index({ createdBy: 1, ownerId: 1 });
voucherSchema.index({ status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Voucher', voucherSchema);
