const express = require('express');
const router = express.Router();
console.log('✅ [public.js] Route module initialized');
const mongoose = require('mongoose');
const User = require('../models/User');
const Place = require('../models/Place');
const Feedback = require('../models/Feedback');
const BusinessAccount = require('../models/BusinessAccount');

// Helper: build safe $or query that avoids CastError for non-ObjectId strings
function buildIdQuery(id) {
  const conditions = [{ customId: id }];
  if (mongoose.Types.ObjectId.isValid(id)) conditions.push({ _id: id });
  return { $or: conditions };
}

// GET /api/public/stats - Tổng quan hệ thống cho Landing Page
router.get('/stats', async (req, res) => {
  try {
    const [userCount, placeCount, feedbackCount] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Place.countDocuments({ status: 'approved' }),
      Feedback.countDocuments()
    ]);
    
    res.json({
      success: true,
      data: {
        userCount: userCount,
        placeCount: placeCount,
        feedbackCount: feedbackCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/public/reviews - Các đánh giá nổi bật cho slider
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await Feedback.find({ rating: { $gte: 4 } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name message rating createdAt');
      
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/public/business/:id - Thông tin đối tác doanh nghiệp
router.get('/business/:id', async (req, res) => {
  try {
    const biz = await BusinessAccount.findOne(buildIdQuery(req.params.id)).select('name displayName avatar customId isVerified');
    if (!biz) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: biz });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/public/businesses - Danh sách doanh nghiệp
router.get('/businesses', async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { status: 'active' };
    if (category) query.category = category;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } }
    ];

    const businesses = await BusinessAccount.find(query)
      .select('name displayName avatar bio category followersCount isVerified coverImage')
      .sort({ points: -1 });
      
    res.json({ success: true, data: businesses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/public/business/:id/full - Trang cá nhân doanh nghiệp chi tiết
router.get('/business/:id/full', async (req, res) => {
  try {
    const biz = await BusinessAccount.findOne(buildIdQuery(req.params.id)).select('-password');
    
    if (!biz) return res.status(404).json({ success: false, message: 'Doanh nghiệp không tồn tại' });

    // Tìm tất cả dịch vụ/tour của doanh nghiệp này (match cả customId lẫn ObjectId)
    const ownerConditions = [{ ownerId: biz.customId }];
    if (biz._id) ownerConditions.push({ ownerId: biz._id.toString() });
    const places = await Place.find({ 
      $or: ownerConditions,
      status: 'approved'
    }).sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      data: {
        profile: biz,
        services: places
      }
    });
  } catch (err) {
    console.error('[public/business/full]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/public/place/:id - Chi tiết điểm du lịch/dịch vụ
router.get('/place/:id', async (req, res) => {
  try {
    const placeQ = [{ id: req.params.id }];
    if (mongoose.Types.ObjectId.isValid(req.params.id)) placeQ.push({ _id: req.params.id });
    const place = await Place.findOne({ $or: placeQ });
    
    if (!place) return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });

    // Lấy thông tin chủ sở hữu (nếu có)
    let owner = null;
    if (place.ownerId) {
      owner = await BusinessAccount.findOne(buildIdQuery(place.ownerId))
        .select('name displayName avatar isVerified customId');
    }

    res.json({ success: true, data: { ...place._doc, owner } });
  } catch (err) {
    console.error('[public/place]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/public/place/:id/reviews - Lấy đánh giá của địa điểm
router.get('/place/:id/reviews', async (req, res) => {
  try {
    const placeQ = [{ id: req.params.id }];
    if (mongoose.Types.ObjectId.isValid(req.params.id)) placeQ.push({ _id: req.params.id });
    const place = await Place.findOne({ $or: placeQ }).select('reviews');
    
    if (!place) return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
    res.json({ success: true, data: place.reviews || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/public/destinations - Lấy danh sách địa điểm nổi bật/mới
router.get('/destinations', async (req, res) => {
  try {
    const { featured, limit, kind } = req.query;
    const query = { status: 'approved' };
    if (featured === 'true') query.top = true;
    if (kind) query.kind = kind;

    const destinations = await Place.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 10);
      
    res.json({ success: true, data: destinations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/public/all-places - Lấy TẤT CẢ dịch vụ, địa điểm (cho Business Directory)
router.get('/all-places', async (req, res) => {
  try {
    const places = await Place.find({ status: 'approved' }).sort({ createdAt: -1 });
    
    // Gắn thêm ownerName cho từng place để hiển thị đẹp hơn
    const enrichedPlaces = await Promise.all(places.map(async (p) => {
      let ownerName = 'WanderViệt Partner';
      if (p.ownerId) {
        const owner = await BusinessAccount.findOne(buildIdQuery(p.ownerId)).select('displayName name');
        if (owner) ownerName = owner.displayName || owner.name;
      }
      return { ...p._doc, ownerName };
    }));

    res.json({ success: true, data: enrichedPlaces });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
