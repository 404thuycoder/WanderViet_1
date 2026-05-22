const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Place = require('../models/Place');
const User = require('../models/User');
const { auth, adminTokenAuth } = require('./auth');
const { syncBusinessXP } = require('../utils/rankUtils');
// Bổ sung fs để đọc từ file json tạm thời mô phỏng CSDL (khi chưa insert lên MongoDB)
const fs = require('fs');
const path = require('path');
const BusinessAccount = require('../models/BusinessAccount');

// Fallback logic
let placesData = [];
try {
  // Load the JavaScript file and extract WANDER_PLACES
  const placesDataPath = path.join(__dirname, '../../apps/user-web/js/places-data.js');
  const content = fs.readFileSync(placesDataPath, 'utf-8');
  // Extract the array part from window.WANDER_PLACES = [...]
  const arrayMatch = content.match(/window\.WANDER_PLACES\s*=\s*(\[[\s\S]*\]);/);
  if (arrayMatch) {
    // Use Function constructor to safely parse the array (safer than eval for static data)
    const arrayStr = arrayMatch[1];
    placesData = new Function('return ' + arrayStr)();
  }
} catch (e) {
  console.error("Error loading places fallback data:", e);
}

// Lấy lịch sử đánh giá của tôi
router.get('/my-reviews', auth, async (req, res) => {
  try {
    const places = await Place.find({ 'reviews.userId': req.user.id }).lean();
    const myReviews = [];
    places.forEach(p => {
      if (p.reviews && Array.isArray(p.reviews)) {
        p.reviews.forEach(r => {
          if (r.userId === req.user.id) {
            myReviews.push({
              placeId: p.id,
              placeName: p.name,
              placeImage: (p.images && p.images[0]) || p.image || '',
              ...r
            });
          }
        });
      }
    });
    res.json({ success: true, data: myReviews.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) });
  } catch(err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy chi tiết một địa điểm
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let place;
    if (mongoose.Types.ObjectId.isValid(id)) {
      place = await Place.findById(id).lean();
    } else {
      place = await Place.findOne({ id: id }).lean();
    }

    // Fallback to static data if not found in DB
    if (!place && placesData && placesData.length > 0) {
      place = placesData.find(p => p.id === id || p._id === id);
    }

    if (!place) return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });

    if (place.ownerId) {
      const biz = await BusinessAccount.findById(place.ownerId).select('displayName name').lean().catch(() => null);
      if (biz) place.ownerName = biz.displayName || biz.name;
    }

    // Increment views count
    await Place.findByIdAndUpdate(place._id, { $inc: { viewsCount: 1 } });

    res.json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API để tạo địa điểm mới với đầy đủ thông tin (cho Business)
router.post('/', auth, async (req, res) => {
  try {
    const {
      name, slug, kind, region, country, city, address, description, overview,
      highlights, experience, image, images, tags, interests, habits, budget, pace,
      priceFrom, priceTo, averagePrice, openTime, closeTime, openDays, amenities,
      contactPhone, contactEmail, website, visitDuration, crowdLevel, costLevel,
      suitability, bestTimeToVisit, bestSeason, weatherTags, internetQuality,
      parking, accessibility, capacity, gallery, coverImage, videoUrl, reelUrls,
      experiences, suggestedItineraries, faqs, safetyTips, whatToBring, whatNotToDo,
      nearbyPlaces, costEstimation, seo, aiSummary, aiVibe, aiTags
    } = req.body;

    const newPlace = new Place({
      id: Date.now().toString(),
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      kind,
      region,
      country: country || 'Việt Nam',
      city,
      address,
      description,
      overview,
      highlights,
      experience,
      image,
      images,
      tags,
      interests,
      habits,
      budget,
      pace,
      ownerId: req.user.id,
      status: 'pending',
      source: 'partner',
      priceFrom,
      priceTo,
      averagePrice,
      openTime,
      closeTime,
      openDays,
      amenities,
      contactPhone,
      contactEmail,
      website,
      visitDuration,
      crowdLevel,
      costLevel,
      suitability,
      bestTimeToVisit,
      bestSeason,
      weatherTags,
      internetQuality,
      parking,
      accessibility,
      capacity,
      gallery,
      coverImage,
      videoUrl,
      reelUrls,
      experiences,
      suggestedItineraries,
      faqs,
      safetyTips,
      whatToBring,
      whatNotToDo,
      nearbyPlaces,
      costEstimation,
      seo,
      aiSummary,
      aiVibe,
      aiTags
    });

    await newPlace.save();
    res.json({ success: true, data: newPlace });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API để cập nhật địa điểm (cho Business)
router.put('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const place = await Place.findOne({ id: id });

    if (!place) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
    }

    // Check ownership
    if (place.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa địa điểm này' });
    }

    const updateData = req.body;
    updateData.updatedAt = new Date();

    const updatedPlace = await Place.findOneAndUpdate(
      { id: id },
      { $set: updateData },
      { new: true }
    );

    res.json({ success: true, data: updatedPlace });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API để upload ảnh vào gallery
router.post('/:id/gallery', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const { url, type, category, caption } = req.body;

    const place = await Place.findOne({ id: id });
    if (!place) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
    }

    if (place.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thêm ảnh' });
    }

    const newGalleryItem = {
      url,
      type: type || 'image',
      category: category || 'general',
      caption,
      uploadedBy: 'business',
      likes: 0,
      isCover: false,
      createdAt: new Date()
    };

    place.gallery.push(newGalleryItem);
    await place.save();

    res.json({ success: true, data: newGalleryItem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API để thêm trải nghiệm
router.post('/:id/experiences', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, icon, difficulty, duration, priceEstimate, bestTime, requirements, highlights } = req.body;

    const place = await Place.findOne({ id: id });
    if (!place) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
    }

    if (place.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thêm trải nghiệm' });
    }

    const newExperience = {
      title,
      description,
      icon,
      difficulty: difficulty || 'easy',
      duration,
      priceEstimate,
      bestTime,
      requirements,
      highlights
    };

    place.experiences.push(newExperience);
    await place.save();

    res.json({ success: true, data: newExperience });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API để thêm FAQ
router.post('/:id/faqs', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const { question, answer } = req.body;

    const place = await Place.findOne({ id: id });
    if (!place) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
    }

    if (place.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thêm FAQ' });
    }

    const newFAQ = {
      question,
      answer,
      helpfulCount: 0,
      createdBy: 'business',
      createdAt: new Date()
    };

    place.faqs.push(newFAQ);
    await place.save();

    res.json({ success: true, data: newFAQ });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API để vote FAQ hữu ích
router.post('/:id/faqs/:faqId/vote', auth, async (req, res) => {
  try {
    const { id, faqId } = req.params;

    let place;
    if (mongoose.Types.ObjectId.isValid(id)) {
      place = await Place.findById(id);
    }
    if (!place) {
      place = await Place.findOne({ id: id });
    }
    
    if (!place) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
    }

    const faq = place.faqs.id(faqId);
    if (!faq) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy FAQ' });
    }

    if (!faq.votedBy) faq.votedBy = [];
    const userId = req.user.id;
    const voteIndex = faq.votedBy.indexOf(userId);

    let isHelpful = false;
    if (voteIndex > -1) {
      faq.votedBy.splice(voteIndex, 1);
      faq.helpfulCount = Math.max(0, faq.helpfulCount - 1);
    } else {
      faq.votedBy.push(userId);
      faq.helpfulCount += 1;
      isHelpful = true;
    }

    await place.save();

    res.json({ success: true, helpfulCount: faq.helpfulCount, isHelpful });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Memory cache for business names to speed up place listing
let cachedBizMap = null;
let lastBizCacheTime = 0;
const BIZ_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Lấy danh sách Address
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    
    // Refresh business cache if needed
    if (!cachedBizMap || now - lastBizCacheTime > BIZ_CACHE_TTL) {
        const businesses = await BusinessAccount.find().select('customId name displayName').lean();
        const bizMap = new Map();
        businesses.forEach(b => {
          if (b.customId) bizMap.set(b.customId, b.displayName || b.name);
          bizMap.set(b._id.toString(), b.displayName || b.name);
        });
        cachedBizMap = bizMap;
        lastBizCacheTime = now;
    }

    // Lọc theo query params
    let query = { status: 'approved' };
    if (req.query.isTour === 'true') {
      query.isTour = true;
    } else if (req.query.isTour === 'false') {
      query.isTour = { $ne: true };
    }

    const places = await Place.find(query)
           .select('id name region address meta text budget pace image images verified top favoritesCount ownerId lat lng transportTips priceFrom priceTo ratingAvg reviewCount kind description isTour')
           .limit(req.query.limit ? parseInt(req.query.limit) : 100)
           .lean();

    const data = places.map(p => ({
      ...p,
      ownerName: p.ownerId ? (cachedBizMap.get(p.ownerId) || 'Đối tác WanderViet AI') : null
    }));

    if (data && data.length > 0) {
      return res.json({ success: true, data });
    }
    
    // Nếu db trống, tự động chèn dữ liệu mẫu vào MongoDB (Seeding)
    if (placesData && placesData.length > 0) {
      console.log('Database trống. Đang tự động nạp dữ liệu mẫu vào MongoDB...');
      const seedData = placesData.map(p => ({ ...p, status: 'approved' }));
      await Place.insertMany(seedData);
      console.log('Nạp dữ liệu mẫu thành công!');
      const newPlaces = await Place.find({}).lean();
      return res.json({ success: true, data: newPlaces });
    }

    return res.json({ success: true, data: [], source: 'memory' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API để reset/nạp lại dữ liệu (Chỉ Super Admin)
router.post('/seed', adminTokenAuth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ success: false, message: 'Chỉ Super Admin mới được seed data' });
    const enriched = placesData.map(p => ({
      ...p,
      favoritesCount: 0,
      ratingAvg: '0',
      reviewCount: 0
    }));
    const inserted = await Place.insertMany(enriched);
    res.json({ success: true, message: `Đã nạp ${inserted.length} địa điểm với dữ liệu tương tác thực tế!` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API để cập nhật lượt yêu thích (Thả tim)
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const id = req.params.id;
    let place;
    if (mongoose.Types.ObjectId.isValid(id)) {
      place = await Place.findById(id);
    }
    if (!place) {
      place = await Place.findOne({ id: id });
    }
    
    if (!place) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
    }

    // Flexible user lookup: by customId, id field, or _id
    const userId = req.user.id || req.user._id;
    const userQuery = { $or: [{ customId: userId }, { id: userId }] };
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userQuery.$or.push({ _id: userId });
    }
    const user = await User.findOne(userQuery);
    if (!user) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });

    // Use _id.toString() as the canonical place identifier to store in favorites
    const placeIdToSave = place._id.toString();
    const isFavorited = Array.isArray(user.favorites) && user.favorites.includes(placeIdToSave);
    
    // Toggle: if currently favorited → remove, else → add
    let updated = false;
    let nowFavorited;
    if (isFavorited) {
      user.favorites = user.favorites.filter(favId => favId !== placeIdToSave);
      place.favoritesCount = Math.max(0, (place.favoritesCount || 0) - 1);
      nowFavorited = false;
      updated = true;
    } else {
      if (!Array.isArray(user.favorites)) user.favorites = [];
      user.favorites.push(placeIdToSave);
      place.favoritesCount = (place.favoritesCount || 0) + 1;
      nowFavorited = true;
      updated = true;
    }

    if (updated) {
      await Promise.all([user.save(), place.save()]);
      if (place.ownerId) {
        syncBusinessXP(place.ownerId).catch(err => console.error('BG Sync XP Error:', err));
      }
    }
    
    res.json({ success: true, favoritesCount: place.favoritesCount, isFavorited: nowFavorited });
  } catch (err) {
    console.error('Favorite error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Thêm Đánh giá (Review)
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, text, userName } = req.body;
    const place = await Place.findOne({ id: req.params.id });
    if (!place) return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm.' });

    const newReview = {
      userId: req.user.id,
      userName: userName || 'Khách',
      rating: Number(rating),
      text: text || '',
      createdAt: new Date()
    };
    
    place.reviews.push(newReview);
    place.reviewCount = place.reviews.length;
    place.ratingAvg = (place.reviews.reduce((acc, curr) => acc + curr.rating, 0) / place.reviewCount).toFixed(1);
    
    await place.save();
    if (place.ownerId) {
      syncBusinessXP(place.ownerId).catch(err => console.error('BG Sync XP Error:', err));
    }
    
    res.json({ success: true, reviews: place.reviews, ratingAvg: place.ratingAvg, reviewCount: place.reviewCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cập nhật trạng thái trải nghiệm bản đồ (Activity Log)
router.post('/:id/activity', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'scheduled', 'experienced', 'missed'
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    const existingLog = user.activityLog.find(log => log.placeId === req.params.id);
    if (existingLog) {
      existingLog.status = status;
      existingLog.updatedAt = new Date();
    } else {
      user.activityLog.push({
        placeId: req.params.id,
        status: status,
        updatedAt: new Date()
      });
    }

    await user.save();
    res.json({ success: true, activityLog: user.activityLog });
  } catch(err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
