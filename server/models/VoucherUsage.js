const mongoose = require('mongoose');

// Lưu lịch sử sử dụng voucher (để kiểm tra perUserLimit & thống kê)
const voucherUsageSchema = new mongoose.Schema({
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', required: true },
  voucherCode: { type: String, required: true },
  userId: { type: String, required: true },
  bookingId: { type: String, default: null },
  
  // Số tiền được giảm thực tế
  discountAmount: { type: Number, required: true },
  
  // Giá gốc trước khi giảm
  originalPrice: { type: Number, default: 0 },
  
  usedAt: { type: Date, default: Date.now }
});

voucherUsageSchema.index({ voucherId: 1, userId: 1 });
voucherUsageSchema.index({ userId: 1, usedAt: -1 });

module.exports = mongoose.model('VoucherUsage', voucherUsageSchema);
