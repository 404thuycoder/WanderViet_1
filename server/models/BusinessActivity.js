const mongoose = require('mongoose');

const businessActivitySchema = new mongoose.Schema({
  placeId: { type: String, required: true, index: true }, // custom id or _id
  placeName: { type: String, default: '' },
  businessCategory: { type: String, enum: ['dining', 'stay', 'tour', 'facility', 'other'], default: 'other' },
  ownerId: { type: String, required: true, index: true }, // userId of the business owner
  userId: { type: String, default: null }, // userId of the customer (if logged in)
  userName: { type: String, default: 'Khách vãng lai' },
  
  type: { 
    type: String, 
    enum: [
      'order',          // Đặt đơn hàng mới
      'check_in',       // Check-in tại địa điểm
      'view_menu',      // Xem menu kỹ thuật số
      'wifi_connect',   // Kết nối WiFi
      'map_view',       // Xem bản đồ tiện ích
      'help_request',   // Yêu cầu hỗ trợ nhanh
      'review',         // Gửi đánh giá
    ], 
    required: true 
  },
  
  details: { type: mongoose.Schema.Types.Mixed, default: {} }, // Thông tin chi tiết (vd: tên món, mã đơn...)
  
  createdAt: { type: Date, default: Date.now, index: true }
});

// Index for fast retrieval of latest activities for a specific business
businessActivitySchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('BusinessActivity', businessActivitySchema);
