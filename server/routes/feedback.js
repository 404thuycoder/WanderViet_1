const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Feedback = require('../models/Feedback');
const { auth, adminTokenAuth, sharedAuth, verifyPortalToken } = require('./auth');
const flexibleAuth = verifyPortalToken(null);
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');
const logAction = require('../utils/logger');
const JWT_SECRET = (process.env.JWT_SECRET || 'wander-viet-secret-key-123').trim();

// Middleware to check user role
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này.' });
    }
    next();
  };
};


// @route   GET /api/feedback/my-feedbacks (Flexible Auth)
router.get('/my-feedbacks', flexibleAuth, async (req, res) => {
  try {
    const email = req.user ? req.user.email : null;
    const userId = req.user ? req.user.id : null;
    const feedbacks = await Feedback.find({ 
      $or: [ { email: email }, { userId: userId } ] 
    }).sort({ createdAt: -1 }).lean();
    
    // Attach businessName if applicable
    const User = require('../models/User');
    const BusinessAccount = require('../models/BusinessAccount');
    const Place = require('../models/Place');
    const mongoose = require('mongoose');
    
    for (let f of feedbacks) {
      if (f.businessId) {
        // 1. Try matching User or BusinessAccount directly by _id
        let owner = null;
        if (mongoose.Types.ObjectId.isValid(f.businessId)) {
          owner = await BusinessAccount.findById(f.businessId).lean() || await User.findById(f.businessId).lean();
        }
        // 2. Try matching by customId
        if (!owner) {
          owner = await BusinessAccount.findOne({ customId: f.businessId }).lean() || await User.findOne({ customId: f.businessId }).lean();
        }
        // 3. Try finding a Place with this ownerId, then get that Place owner
        if (!owner) {
          const place = await Place.findOne({ ownerId: f.businessId }).lean();
          if (place && place.ownerId) {
            if (mongoose.Types.ObjectId.isValid(place.ownerId)) {
              owner = await BusinessAccount.findById(place.ownerId).lean() || await User.findById(place.ownerId).lean();
            }
            if (!owner) {
              owner = await BusinessAccount.findOne({ customId: place.ownerId }).lean() || await User.findOne({ customId: place.ownerId }).lean();
            }
          }
        }
        
        if (owner) {
          f.businessName = owner.displayName || owner.name;
        } else {
          // 4. Fallback: extract name from message pattern "[Từ dịch vụ: NAME]"
          const match = (f.message || '').match(/\[Từ dịch vụ:\s*(.*?)\]/);
          if (match && match[1]) {
            f.businessName = match[1].trim();
          }
        }
      }
    }
    
    res.json({ success: true, data: feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch sử phản hồi' });
  }
});

// @route   POST /api/feedback (Public submission with merging)
router.post('/', flexibleAuth, async (req, res) => {
  try {
    let { name, email, message, image } = req.body;
    
    // Auto-prefill from auth if missing
    if (req.user) {
      name = name || req.user.displayName || req.user.name;
      email = email || req.user.email;
    }
    
    if (!message || !name || !email) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tên, email và nội dung' });
    }

    // Find existing open thread: prefer userId match, fallback to email
    const query = { status: 'open' };
    const isBusinessTarget = req.body.targetRole === 'business' || req.body.role === 'business';
    if (isBusinessTarget) {
      query.role = 'business';
      if (req.body.businessId) query.businessId = req.body.businessId;
    } else {
      query.role = { $ne: 'business' }; // System feedback
    }

    if (req.user && req.user.id) {
      query.$or = [{ userId: req.user.id }, { email }];
    } else {
      query.email = email;
    }
    
    let targetFeedback = await Feedback.findOne(query).sort({ createdAt: -1 });

    if (targetFeedback) {
      // Append as reply
      targetFeedback.replies.push({
        senderId: req.user ? req.user.id : null,
        senderName: name,
        senderRole: 'user',
        content: message,
        createdAt: new Date()
      });
      if (req.user) targetFeedback.userId = req.user.id;
      await targetFeedback.save();
    } else {
      // Create new thread
      const feedbackData = {
        name,
        email,
        message,
        image,
        replies: []
      };
      const isBusinessTarget = req.body.targetRole === 'business' || req.body.role === 'business';
      if (isBusinessTarget) {
        feedbackData.role = 'business';
        if (req.body.businessId) feedbackData.businessId = req.body.businessId;
      }
      if (req.user) {
        feedbackData.userId = req.user.id;
        if (!feedbackData.role) feedbackData.role = req.user.role || 'user';
      }
      targetFeedback = await Feedback.create(feedbackData);
    }

    // Notify Admin or Business
    if (isBusinessTarget && req.body.businessId) {
      await Notification.create({
        recipientId: req.body.businessId,
        recipientType: 'business',
        senderId: req.user ? req.user.id : null,
        senderName: name,
        type: 'message',
        title: 'Phản hồi mới từ khách hàng',
        message: `${name} vừa gửi một yêu cầu phản hồi về dịch vụ.`,
        relatedId: targetFeedback._id,
        link: 'business-messages.html', // hypothetical link
        isRead: false
      });
    } else {
      await Notification.create({
        recipientId: 'ROLE_ADMIN',
        recipientType: 'admin',
        senderId: req.user ? req.user.id : null,
        senderName: name,
        type: 'message',
        title: 'Phản hồi mới từ người dùng',
        message: `${name} vừa gửi một phản hồi mới.`,
        relatedId: targetFeedback._id,
        link: 'feedback.html',
        isRead: false
      });
    }

    await logAction('FEEDBACK_SUBMITTED', `Người dùng ${name} đã gửi một phản hồi mới`, req, { name, email, role: targetFeedback.role });

    res.status(201).json({ success: true, message: 'Gửi thành công', data: targetFeedback });
  } catch (err) {
    console.error('Feedback Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi gửi phản hồi' });
  }
});

// @route   PUT /api/feedback/:id/status
router.put('/:id/status', adminTokenAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    res.json({ success: true, data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/feedback/:id/reply (Admin & Business only)
router.post('/:id/reply', flexibleAuth, async (req, res) => {
  try {
    const { content, image } = req.body;
    if (!content && !image) return res.status(400).json({ success: false, message: 'Nội dung hoặc ảnh không được để trống' });
    
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc hội thoại' });

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = (feedback.userId && feedback.userId.toString() === req.user.id.toString()) || 
                    (feedback.email && feedback.email.toLowerCase() === req.user.email.toLowerCase());

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền phản hồi hội thoại này.' });
    }

    const reply = {
      senderId: req.user.id,
      senderName: req.user.displayName || req.user.name || (isAdmin ? 'Quản trị viên' : 'Thành viên'),
      senderRole: isAdmin ? 'admin' : (req.user.role === 'business' ? 'business' : 'user'),
      content,
      image,
      createdAt: new Date()
    };

    feedback.replies.push(reply);
    feedback.updatedAt = new Date();
    await feedback.save();

    // Notify logic
    if (isAdmin) {
      // Notify Partner/User
      let recipientId = feedback.userId;
      if (!recipientId && feedback.email) {
        const User = require('../models/User');
        const u = await User.findOne({ email: feedback.email });
        if (u) recipientId = u.customId || u.id || u._id.toString();
      }
      if (recipientId) {
        await Notification.create({
          recipientId,
          recipientType: feedback.role || 'user',
          senderId: req.user.id,
          senderName: req.user.name || 'Quản trị viên',
          type: 'message',
          title: 'Phản hồi mới từ Quản trị viên',
          message: `Admin trả lời: "${content.substring(0, 50)}..."`,
          relatedId: feedback._id,
          link: 'feedback.html',
          isRead: false
        });
      }
    } else {
      // Notify Admin (Business replied)
      await Notification.create({
        recipientId: 'ROLE_ADMIN',
        recipientType: 'admin',
        senderId: req.user.id,
        senderName: req.user.name || 'Đối tác',
        type: 'message',
        title: 'Tin nhắn mới từ Đối tác',
        message: `${req.user.name || 'Đối tác'} đã trả lời hỗ trợ.`,
        relatedId: feedback._id,
        link: 'feedback.html',
        isRead: false
      });
      await logAction('FEEDBACK_REPLY', `Đối tác ${req.user.name} phản hồi hỗ trợ`, req, { feedbackId: req.params.id });
    }

    res.json({ success: true, data: reply });
  } catch (err) {
    console.error('Feedback Reply Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/feedback/:id
router.delete('/:id', adminTokenAuth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    res.json({ success: true, message: 'Đã xóa hội thoại thành công' });
  } catch (err) {
    console.error('Feedback delete error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
