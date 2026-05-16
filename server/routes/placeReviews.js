const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
console.log('[PlaceReview Model] Initializing Schema (Version: String IDs)');
const multer = require('multer');
const path = require('path');
const PlaceReview = require('../models/PlaceReview');
const Place = require('../models/Place');
const Notification = require('../models/Notification');
const { auth } = require('./auth');
const { sendNotification } = require('../utils/socketManager');
const { uploadFile } = require('../utils/gridfsStorage');

// Multer config for review images - using memory storage for MongoDB base64
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const User = require('../models/User');

// Helper to resolve customId to real Identity
async function resolveUserId(id) {
  if (!id) return null;
  const tid = id.toString().trim();
  const user = await User.findOne({ 
    $or: [
      { customId: tid },
      { id: tid }
    ]
  }).select('_id customId');
  
  if (user) {
      return user.customId || user.id || user._id.toString();
  }
  return tid;
}

// @route   POST /api/place-reviews
// @desc    Add a review for a place (Local feedback)
router.post('/', auth, upload.array('image', 10), async (req, res) => {
  console.log('[PlaceReview POST] Version: String IDs Enabled');
  try {
    let { placeId, content, rating, suitability } = req.body;
    const realUserId = await resolveUserId(req.user.id);

    // Validation
    if (!placeId || !content || !rating) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Đánh giá phải từ 1 đến 5 sao' });
    }

    // 2. Resolve Place Id (just use the string)
    const realPlaceId = placeId;

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const images = [];
    if (req.files && req.files.length > 0) {
      console.log(`[PlaceReview POST] Processing ${req.files.length} images`);
      for (const file of req.files) {
        try {
          const uploadedFile = await uploadFile(file, `review_${Date.now()}_${file.originalname}`, {
            userId: realUserId,
            placeId: realPlaceId,
            type: 'review_image'
          });
          
          if (uploadedFile && uploadedFile.id) {
            const imageUrl = `/api/files/${uploadedFile.id}`;
            images.push(imageUrl);
            console.log(`[PlaceReview POST] Image uploaded: ${imageUrl}`);
          } else {
            console.error('[PlaceReview POST] uploadFile returned invalid result:', uploadedFile);
          }
        } catch (uploadErr) {
          console.error(`[PlaceReview POST] Individual image upload failed: ${uploadErr.message}`);
          // Continue with other images or skip this one
        }
      }
    }

    // Use direct collection insert to bypass Mongoose schema caching/validation issues
    const reviewData = {
      placeId: realPlaceId,
      userId: realUserId,
      userName: req.user.displayName || req.user.name,
      userAvatar: req.user.avatar || '',
      rating: parseInt(rating),
      content,
      images,
      suitability,
      status: 'approved',
      createdAt: new Date()
    };

    const result = await PlaceReview.collection.insertOne(reviewData);
    const review = { _id: result.insertedId, ...reviewData };

    // Update place stats
    const place = await Place.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(realPlaceId) ? new mongoose.Types.ObjectId(realPlaceId) : null }, { id: realPlaceId }, { slug: realPlaceId }] });
    if (place) {
      const allReviews = await PlaceReview.find({ placeId: realPlaceId, status: 'approved' });
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      place.ratingAvg = avg.toFixed(1);
      place.reviewCount = allReviews.length;
      await place.save();
    }

    res.json({ success: true, data: review });
  } catch (err) {
    // Optimized logging: only log the message to avoid long stack traces in console
    console.error('[PlaceReview POST] Error:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
});

// @route   GET /api/place-reviews/:placeId
// @desc    Get reviews for a specific place
router.get('/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const query = { status: 'approved' };
    
    if (mongoose.Types.ObjectId.isValid(placeId)) {
        query.placeId = new mongoose.Types.ObjectId(placeId);
    } else {
        // Handle custom slug/id if needed, but usually we use ObjectId for reviews
        const place = await Place.findOne({ $or: [{ id: placeId }, { slug: placeId }] }).select('_id');
        if (!place) return res.json({ success: true, data: [] });
        query.placeId = place._id;
    }

    const reviews = await PlaceReview.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/place-reviews/:id/like
// @desc    Like a review (Toggle)
router.post('/:id/like', auth, async (req, res) => {
    try {
        const review = await PlaceReview.findById(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
        
        if (!review.likedBy) review.likedBy = [];
        
        const userId = req.user.id;
        const index = review.likedBy.indexOf(userId);
        
        if (index > -1) {
            // Unlike
            review.likedBy.splice(index, 1);
        } else {
            // Like
            review.likedBy.push(userId);
        }
        
        review.likes = review.likedBy.length;
        await review.save({ validateBeforeSave: false });
        
        res.json({ success: true, likes: review.likes, isLiked: index === -1 });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   POST /api/place-reviews/:id/reply
// @desc    Reply to a review
router.post('/:id/reply', auth, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ success: false, message: 'Nội dung trả lời không được trống' });

        const review = await PlaceReview.findById(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

        const reply = {
            userId: req.user.id,
            userName: req.user.displayName || req.user.name,
            userAvatar: req.user.avatar || '',
            content,
            createdAt: new Date()
        };

        if (!review.replies) review.replies = [];
        review.replies.push(reply);
        
        await review.save({ validateBeforeSave: false });
        res.json({ success: true, data: reply });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
