const mongoose = require('mongoose');

const plannerReviewSchema = new mongoose.Schema({
  // Thông tin người đánh giá
  userId:    { type: String, index: true, default: null }, // null = khách không đăng nhập
  userName:  { type: String, default: 'Khách hàng' },
  userEmail: { type: String, default: '' },
  userAvatar:{ type: String, default: null },

  // Nội dung đánh giá
  rating:    { type: Number, required: true, min: 1, max: 5 },
  comment:   { type: String, required: true, maxlength: 1000 },

  // Nguồn gốc (có thể mở rộng sau)
  source:    { type: String, default: 'planner_sidebar' }, // planner_sidebar | chatbot | etc.

  // Quản lý
  isVisible: { type: Boolean, default: true }, // Admin có thể ẩn review spam
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PlannerReview', plannerReviewSchema);
