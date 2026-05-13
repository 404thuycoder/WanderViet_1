const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
// Use dynamic model retrieval to prevent registration conflicts
const getModel = (name) => mongoose.models[name] || mongoose.model(name);
const Place = require('../models/Place');
const Feedback = require('../models/Feedback');
const { businessAuth, generateCustomId } = require('./auth');
const upload = require('../middlewares/upload');
const logAction = require('../utils/logger');
const BusinessAccount = require('../models/BusinessAccount');
const BusinessMessage = require('../models/BusinessMessage');
const Booking = require('../models/Booking');
const AIInsight = require('../models/AIInsight');
const BusinessActivity = require('../models/BusinessActivity');
const { syncBusinessXP } = require('../utils/rankUtils');

const safeParseArray = (req, field, forceObjectArray = false) => {
  let val = req.body[field];
  if (val === null || val === undefined) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    val = val.trim();
    if (!val || val === '[]' || val === 'null' || val === 'undefined') return [];
    
    try {
      const tryJson = val.replace(/'/g, '"');
      const parsed = JSON.parse(tryJson);
      if (Array.isArray(parsed)) {
        if (forceObjectArray) return parsed.filter(item => typeof item === 'object' && item !== null);
        return parsed;
      }
      return [parsed];
    } catch (e) {
      if (forceObjectArray) return [];
      if (val.includes(',')) {
        return val.split(',').map(s => s.trim().replace(/^['"\[]|['"\]]$/g, '')).filter(Boolean);
      }
      return [val.replace(/^['"\[]|['"\]]$/g, '').trim()];
    }
  }
  return forceObjectArray ? [] : [val];
};

// GET /api/business/reviews — feedbacks for this business's places
router.get('/reviews', businessAuth, async (req, res) => {
  try {
    const places = await Place.find({ ownerId: req.user.id }).select('name reviews').lean();
    
    // Flatten reviews and attach place name
    const feedbacks = [];
    places.forEach(p => {
      (p.reviews || []).forEach(r => {
        feedbacks.push({
          ...r,
          placeName: p.name,
          placeId: p._id
        });
      });
    });

    // Sort by date newest
    feedbacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: feedbacks, places });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/business/analytics — time-series data for charts
router.get('/analytics', businessAuth, async (req, res) => {
  try {
    const places = await Place.find({ ownerId: req.user.id }).lean();
    const totalViews = places.reduce((s, p) => s + (p.favoritesCount || 0), 0);
    const totalReviews = places.reduce((s, p) => s + (p.reviewCount || 0), 0);
    const avgRating = places.length
      ? (places.reduce((s, p) => s + parseFloat(p.ratingAvg || 0), 0) / places.length).toFixed(1)
      : null;
    // Build simple 7-day simulated trend from actual totals
    const trend = Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      views: Math.round((totalViews / 7) * (0.7 + Math.random() * 0.6)),
      reviews: Math.round((totalReviews / 7) * (0.7 + Math.random() * 0.6))
    }));
    res.json({ success: true, data: { totalViews, totalReviews, avgRating, totalServices: places.length, places, trend } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── NEW: Dashboard Comprehensive Stats ──────────────────────────
router.get('/dashboard/stats', businessAuth, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const BusinessActivity = getModel('BusinessActivity');
    
    // 1. Get Totals from Places
    const places = await Place.find({ ownerId });
    const totalServices = places.length;
    
    // 2. Get Bookings Stats
    const bookings = await Booking.find({ ownerId });
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const successfulBookings = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed').length;

    // 3. Get Activity Stats (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activities = await BusinessActivity.find({ 
      ownerId, 
      createdAt: { $gte: thirtyDaysAgo } 
    }).lean();

    const totalInteractions = activities.length;
    const views = activities.filter(a => ['view_menu', 'map_view'].includes(a.type)).length;
    const checkins = activities.filter(a => a.type === 'check_in').length;
    const helpRequests = activities.filter(a => a.type === 'help_request').length;
    
    // Unique users
    const activeUsers = new Set(activities.map(a => a.userId).filter(id => id)).size;

    // Conversion rate
    const conversionRate = views > 0 ? ((totalBookings / views) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalServices,
          totalBookings,
          totalRevenue,
          successfulBookings,
          activeUsers
        },
        engagement: {
          totalInteractions,
          views,
          checkins,
          helpRequests,
          conversionRate
        },
        recentActivities: activities.slice(0, 10)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Middleware to verify business role
// 1. Get places owned by this specific business
router.get('/places', businessAuth, async (req, res) => {
  try {
    const places = await Place.find({ ownerId: req.user.id });
    res.json({ success: true, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 1b. Get stats for business dashboard
router.get('/stats', businessAuth, async (req, res) => {
  try {
    const BookingModel = getModel('Booking');
    const days = parseInt(req.query.days) || 7; // Default 7 days
    
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.setHours(0,0,0,0));

    const [places, allBookings, messages] = await Promise.all([
      Place.find({ ownerId: req.user.id }),
      BookingModel.find({ ownerId: req.user.id }),
      BusinessMessage.find({ businessId: req.user.id, isRead: false, senderRole: 'customer' })
    ]);

    // Current period vs Previous period bookings
    const currentBookings = allBookings.filter(b => new Date(b.createdAt) >= startDate);
    const prevBookings = allBookings.filter(b => new Date(b.createdAt) >= prevStartDate && new Date(b.createdAt) < startDate);

    // Revenue calculations
    const validStatuses = ['confirmed', 'completed'];
    const currentRevenue = currentBookings.filter(b => validStatuses.includes(b.status)).reduce((s, b) => s + (b.totalPrice || 0), 0);
    const prevRevenue = prevBookings.filter(b => validStatuses.includes(b.status)).reduce((s, b) => s + (b.totalPrice || 0), 0);
    const revenueTrend = prevRevenue > 0 ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100) : (currentRevenue > 0 ? 100 : 0);
    const bookingTrend = prevBookings.length > 0 ? Math.round(((currentBookings.length - prevBookings.length) / prevBookings.length) * 100) : (currentBookings.length > 0 ? 100 : 0);

    // Actionable Alerts
    const pendingBookings = allBookings.filter(b => b.status === 'pending').length;
    const lowReviews = places.reduce((sum, p) => sum + (p.reviews ? p.reviews.filter(r => r.rating <= 2).length : 0), 0);

    // General Stats - NOW USING REAL ACTIVITY DATA
    const BusinessActivity = getModel('BusinessActivity');
    const totalViews = await BusinessActivity.countDocuments({ 
      ownerId: req.user.id, 
      type: { $in: ['view_menu', 'map_view', 'view_detail'] } 
    });
    
    const totalReviews = places.reduce((sum, p) => sum + (p.reviewCount || 0), 0);
    const avgRating = places.length > 0 ? (places.reduce((sum, p) => sum + parseFloat(p.ratingAvg || 0), 0) / places.length).toFixed(1) : '0.0';

    const bookingsToday = allBookings.filter(b => new Date(b.createdAt) >= todayStart).length;
    const revenueToday = allBookings.filter(b => validStatuses.includes(b.status) && new Date(b.createdAt) >= todayStart).reduce((s, b) => s + (b.totalPrice || 0), 0);

    // Chart Data: Revenue Series
    const revenueChartData = { labels: [], data: [] };
    const breakdown = {};
    
    // Initialize chart labels and data based on days
    if (days <= 30) {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(new Date().getTime() - i * 24 * 60 * 60 * 1000);
        revenueChartData.labels.push(`${d.getDate()}/${d.getMonth()+1}`);
        revenueChartData.data.push(0);
      }
    } else {
       // Months for larger ranges (e.g., 365)
       const months = 12;
       for (let i = months - 1; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          revenueChartData.labels.push(`T${d.getMonth()+1}`);
          revenueChartData.data.push(0);
       }
    }

    currentBookings.forEach(b => {
      if (validStatuses.includes(b.status)) {
        // Build Breakdown
        const placeName = b.placeName || 'Khác';
        breakdown[placeName] = (breakdown[placeName] || 0) + (b.totalPrice || 0);

        // Build Series
        const bDate = new Date(b.createdAt);
        if (days <= 30) {
           const label = `${bDate.getDate()}/${bDate.getMonth()+1}`;
           const idx = revenueChartData.labels.indexOf(label);
           if (idx !== -1) revenueChartData.data[idx] += (b.totalPrice || 0);
        } else {
           const label = `T${bDate.getMonth()+1}`;
           const idx = revenueChartData.labels.indexOf(label);
           if (idx !== -1) revenueChartData.data[idx] += (b.totalPrice || 0);
        }
      }
    });

    const revenueBreakdown = Object.keys(breakdown).map(k => ({ label: k, value: breakdown[k] }));

    // Calculate tomorrow guests
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0,0,0,0);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    
    let tomorrowGuests = 0;
    allBookings.forEach(b => {
       if (validStatuses.includes(b.status) && b.useDate) {
          const uDate = new Date(b.useDate);
          if (uDate >= tomorrowStart && uDate < tomorrowEnd) {
             tomorrowGuests += (b.peopleCount || 1);
          }
       }
    });

    res.json({
      success: true,
      data: {
        totalServices: places.length,
        activeServices: places.filter(p => p.status === 'approved').length,
        totalViews,
        totalReviews,
        avgRating,
        totalBookings: currentBookings.length, // Filtered by range
        bookingsToday,
        revenueTotal: currentRevenue, // Filtered by range
        revenueToday,
        newMessages: messages.length,
        trends: {
            revenue: revenueTrend,
            bookings: bookingTrend
        },
        actionableAlerts: {
            pendingBookings,
            lowReviews,
            unreadMessages: messages.length,
            tomorrowGuests
        },
        conversionRate: totalViews > 0 ? ((currentBookings.length / totalViews) * 100).toFixed(1) : 0,
        charts: {
            revenueSeries: revenueChartData,
            revenueBreakdown: revenueBreakdown.sort((a,b) => b.value - a.value).slice(0, 5) // Top 5
        }
      }
    });
  } catch (err) {
    console.error('[Stats API Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// 1c. Get recent activities (Now returns Recent Bookings for Data Table)
router.get('/dashboard/activities', businessAuth, async (req, res) => {
  try {
    const { category } = req.query;
    const query = { ownerId: req.user.id };
    if (category && category !== 'all') {
      query.businessCategory = category;
    }

    const BookingModel = getModel('Booking');
    const bookings = await BookingModel.find(query)
                                       .sort({ createdAt: -1 })
                                       .limit(10)
                                       .lean();

    const recentBookings = bookings.map(b => ({
      id: b._id.toString().substring(18), // Short ID
      customerName: b.customerName || 'Khách hàng',
      placeName: b.placeName || 'Dịch vụ',
      status: b.status || 'pending',
      totalPrice: b.totalPrice || 0,
      createdAt: b.createdAt,
      useDate: b.useDate,
      peopleCount: b.peopleCount || 1,
      paymentMethod: b.paymentMethod || 'contact',
      paymentStatus: b.paymentStatus || 'unpaid'
    }));

    res.json({ success: true, data: recentBookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 1d. AI Business Analytics PRO
router.get('/ai-analytics', businessAuth, async (req, res) => {
  try {
    const BookingModel = getModel('Booking');
    const AIInsightModel = getModel('AIInsight');
    const PlaceModel = getModel('Place');
    const bizId = req.user.id;

    // Time ranges
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Trend & Time Comparison
    const [currWeekBookings, prevWeekBookings, currMonthBookings, todayBookings] = await Promise.all([
      BookingModel.countDocuments({ ownerId: bizId, createdAt: { $gte: weekAgo } }),
      BookingModel.countDocuments({ ownerId: bizId, createdAt: { $gte: twoWeeksAgo, $lt: weekAgo } }),
      BookingModel.countDocuments({ ownerId: bizId, createdAt: { $gte: monthAgo } }),
      BookingModel.countDocuments({ ownerId: bizId, createdAt: { $gte: dayAgo } })
    ]);

    let trend = 'ổn định';
    let trendPercent = 0;
    if (prevWeekBookings > 0) {
      trendPercent = Math.round(((currWeekBookings - prevWeekBookings) / prevWeekBookings) * 100);
      if (trendPercent > 10) trend = 'tăng';
      else if (trendPercent < -10) trend = 'giảm';
    } else if (currWeekBookings > 0) {
      trend = 'tăng';
      trendPercent = 100;
    }

    // 2. Conversion Rate
    const myPlaces = await PlaceModel.find({ ownerId: bizId }).select('region priceFrom favoritesCount reviewCount');
    const totalViews = myPlaces.reduce((s, p) => s + (p.favoritesCount || 0), 0) || 100;
    const conversionRate = ((currMonthBookings / totalViews) * 100).toFixed(1);

    // 3. Anomaly Detection
    const avgDailyBookings = currWeekBookings / 7;
    let anomaly = null;
    if (todayBookings < avgDailyBookings * 0.3 && avgDailyBookings > 1) {
      anomaly = {
        type: 'giảm đột ngột',
        severity: 'high',
        message: 'Lượng đặt chỗ hôm nay thấp hơn 70% so với trung bình tuần qua.'
      };
    }

    // 4. Hot Locations & Market Price
    const hotLocsRaw = await BookingModel.aggregate([
      { $match: { createdAt: { $gte: monthAgo } } },
      { $group: { _id: "$placeId", count: { $sum: 1 }, name: { $first: "$placeName" } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]) || [];

    const placeIds = hotLocsRaw.map(l => l._id).filter(Boolean);
    // placeIds are custom string IDs, NOT MongoDB ObjectIds — only query by 'id' field
    const placesInfo = placeIds.length > 0 ? await PlaceModel.find({ id: { $in: placeIds } }).select('region name') : [];
    
    const regionStats = {};
    hotLocsRaw.forEach(l => {
      const p = placesInfo.find(info => (info.id && info.id === l._id) || (info._id && info._id.toString() === l._id));
      const reg = p ? p.region : 'Việt Nam';
      regionStats[reg] = (regionStats[reg] || 0) + l.count;
    });

    const hotLocations = Object.entries(regionStats).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
    const myRegions = [...new Set(myPlaces.map(p => p.region).filter(Boolean))];
    
    let marketPrice = 0;
    let priceEvaluation = 'Chưa có dữ liệu';
    if (myRegions.length > 0) {
      const marketPlaces = await PlaceModel.find({ region: { $in: myRegions }, priceFrom: { $gt: 0 } }).select('priceFrom');
      if (marketPlaces.length > 0) {
        const totalMarketPrice = marketPlaces.reduce((s, p) => s + (Number(p.priceFrom) || 0), 0);
        marketPrice = Math.round(totalMarketPrice / marketPlaces.length);
        const myAvgPrice = myPlaces.length > 0 ? (myPlaces.reduce((s, p) => s + (Number(p.priceFrom) || 0), 0) / myPlaces.length) : 0;
        if (myAvgPrice > marketPrice * 1.15) priceEvaluation = 'Cao hơn thị trường 15%';
        else if (myAvgPrice < marketPrice * 0.85) priceEvaluation = 'Cạnh tranh cực tốt';
        else priceEvaluation = 'Ổn định theo thị trường';
      }
    }

    // 5. Explainable AI Suggestions
    let suggestion = 'Tiếp tục duy trì chất lượng dịch vụ hiện tại.';
    let reason = 'Dựa trên hiệu suất ổn định của tuần qua.';
    
    if (anomaly) {
      suggestion = 'Kiểm tra lại tình trạng hiển thị của dịch vụ hoặc khởi tạo chương trình giảm giá chớp nhoáng (Flash Sale).';
      reason = `Phát hiện bất thường: ${anomaly.message}`;
    } else if (trend === 'giảm') {
      suggestion = 'Cân nhắc giảm giá 10% hoặc chạy quảng cáo tập trung vào các điểm hot.';
      reason = `Số lượng booking tuần này (${currWeekBookings}) giảm ${Math.abs(trendPercent)}% so với tuần trước (${prevWeekBookings}).`;
    } else if (priceEvaluation.includes('15%')) {
      suggestion = 'Điều chỉnh giá giảm khoảng 10-15% để tăng tính cạnh tranh.';
      reason = `Giá trung bình của bạn đang cao hơn mặt bằng chung ${marketPrice.toLocaleString()}đ của khu vực ${myRegions.join(', ')}.`;
    } else if (conversionRate < 1) {
      suggestion = 'Tối ưu hóa hình ảnh và mô tả dịch vụ để tăng tỷ lệ chốt đơn.';
      reason = `Tỷ lệ chuyển đổi của bạn chỉ đạt ${conversionRate}%, thấp hơn mức trung bình ngành (2-3%).`;
    } else if (hotLocations.some(loc => myRegions.includes(loc))) {
      suggestion = 'Tăng ngân sách quảng cáo cho khu vực này vì nhu cầu thị trường đang rất lớn.';
      reason = `${myRegions.filter(r => hotLocations.includes(r)).join(', ')} đang lọt Top 3 địa điểm hot nhất tháng này.`;
    }

    // 6. Save Insight to History (Safe-Fail)
    try {
      await new AIInsightModel({
        ownerId: bizId,
        type: anomaly ? 'anomaly' : 'suggestion',
        title: 'AI Insight hàng ngày',
        content: suggestion,
        reason: reason,
        metrics: { value: currWeekBookings, previousValue: prevWeekBookings, percentChange: trendPercent }
      }).save();
    } catch (saveErr) {
      console.warn('[AI-Analytics] History save failed (non-critical):', saveErr.message);
    }

    // 7. Market Future Outlook (PRO+)
    const currentMonth = now.getMonth(); // 0-11
    let seasonalFactor = 1.0;
    let marketOutlook = 'Ổn định';
    let marketAdvice = 'Duy trì chính sách hiện tại.';

    // Simple seasonal logic for Vietnam travel
    if ([4, 5, 6, 7].includes(currentMonth)) { // Summer peak
      seasonalFactor = 1.4;
      marketOutlook = 'Tăng trưởng mạnh (Mùa hè)';
      marketAdvice = 'Nhu cầu thị trường sắp tới sẽ rất cao, hãy chuẩn bị nhân sự và cân nhắc tăng giá 10-20%.';
    } else if ([0, 1].includes(currentMonth)) { // Lunar New Year
      seasonalFactor = 1.3;
      marketOutlook = 'Tăng trưởng (Lễ Tết)';
      marketAdvice = 'Thị trường sẽ bùng nổ đặt chỗ ngắn ngày, ưu tiên các gói combo gia đình.';
    } else if ([8, 9, 10].includes(currentMonth)) { // Low season
      seasonalFactor = 0.7;
      marketOutlook = 'Thấp điểm';
      marketAdvice = 'Thị trường sắp vào giai đoạn trầm lắng, hãy tung các gói khuyến mãi dài ngày.';
    }

    const marketPredictedGrowth = Math.round((seasonalFactor - 1) * 100);
    const businessVsMarket = trendPercent >= marketPredictedGrowth ? 'Tốt hơn trung bình' : 'Cần cải thiện';

    res.json({
      success: true,
      data: {
        trend,
        trendPercent,
        monthBookings: currMonthBookings,
        conversionRate,
        anomaly,
        hotLocations: hotLocations.length > 0 ? hotLocations : ['Đà Lạt', 'Phú Quốc', 'Hạ Long'],
        marketPrice,
        priceEvaluation,
        prediction: {
          count: Math.round(currWeekBookings * (1 + trendPercent / 100)) || 25,
          status: trendPercent >= 0 ? 'tăng' : 'giảm'
        },
        marketOutlook: {
          status: marketOutlook,
          growth: marketPredictedGrowth,
          advice: marketAdvice,
          positioning: businessVsMarket
        },
        suggestion,
        reason,
        tier: req.user.tier || 'Free'
      }
    });
  } catch (err) {
    console.error('[AI-Analytics Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Create a new place (with image upload)
router.post('/places', businessAuth, upload.array('imageFile', 10), async (req, res) => {
  try {
    let imagesArr = [];
    
    // 1. Files uploaded
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        imagesArr.push('/uploads/' + file.filename);
      });
    }
    
    // 2. URLs passed as text
    if (req.body.image) {
      imagesArr.push(req.body.image);
    }
    if (req.body.images) {
      let parsedImages = req.body.images;
      if (typeof parsedImages === 'string') {
        try { parsedImages = JSON.parse(parsedImages); } catch (e) { parsedImages = [parsedImages]; }
      }
      if (Array.isArray(parsedImages)) {
        imagesArr = imagesArr.concat(parsedImages);
      }
    }
    
    imagesArr = [...new Set(imagesArr)];

    const amenitiesArr = safeParseArray(req, 'amenities');
    const highlightsArr = safeParseArray(req, 'highlights');
    const tagsArr = safeParseArray(req, 'tags');

    const newPlace = new Place({
      id: generateCustomId(req.body.kind),
      name: req.body.name,
      kind: req.body.kind,
      region: req.body.region,
      address: req.body.address,
      description: req.body.description,
      overview: req.body.overview,
      experience: req.body.experience,
      themeColor: req.body.themeColor,
      meta: req.body.meta,
      priceFrom: req.body.priceFrom,
      priceTo: req.body.priceTo,
      openTime: req.body.openTime,
      closeTime: req.body.closeTime,
      openDays: req.body.openDays,
      contactPhone: req.body.contactPhone,
      contactEmail: req.body.contactEmail,
      website: req.body.website,
      videoUrl: req.body.videoUrl, // Thêm dòng này
      lat: req.body.lat,
      lng: req.body.lng,
      ownerId: req.user.id,
      image: imagesArr[0] || '',
      images: imagesArr,
      highlights: highlightsArr,
      tags: tagsArr,
      amenities: amenitiesArr,
      top: req.body.top === 'true',
      isTour: req.body.isTour === 'true' || req.body.isTour === true,
      status: 'pending',
      source: 'partner',
      amusementPlaces: safeParseArray(req, 'amusementPlaces', true),
      accommodations: safeParseArray(req, 'accommodations', true),
      diningPlaces: safeParseArray(req, 'diningPlaces', true),
      checkInSpots: safeParseArray(req, 'checkInSpots', true)
    });

    await newPlace.save();
    await syncBusinessXP(req.user.id);
    await logAction('PLACE_CREATED', `Đã thêm địa điểm: ${newPlace.name}`, req);
    res.json({ success: true, data: newPlace });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Update own place (with optional image upload)
router.put('/places/:id', businessAuth, upload.array('imageFile', 10), async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['name', 'kind', 'region', 'address'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }
    
    // Validate kind field
    const validKinds = ['diem-du-lich', 'khach-san', 'nha-hang', 'giai-tri', 'trai-nghiem', 'tien-ich'];
    if (!validKinds.includes(req.body.kind)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid kind. Must be one of: ${validKinds.join(', ')}` 
      });
    }

    const place = await Place.findOne({ id: req.params.id, ownerId: req.user.id });
    if (!place) return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm hoặc bạn không có quyền sửa.' });

    let imagesArr = place.images && place.images.length > 0 ? [...place.images] : (place.image ? [place.image] : []);

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        imagesArr.push('/uploads/' + file.filename);
      });
    }

    if (req.body.images !== undefined) {
      let parsedImages = req.body.images;
      if (typeof parsedImages === 'string') {
        try { parsedImages = JSON.parse(parsedImages); } catch (e) { parsedImages = [parsedImages]; }
      }
      if (Array.isArray(parsedImages)) {
        imagesArr = parsedImages;
        if (req.files && req.files.length > 0) {
           req.files.forEach(file => imagesArr.push('/uploads/' + file.filename));
        }
      }
    } else if (req.body.image !== undefined && !req.files) {
      imagesArr = [req.body.image];
    }

    imagesArr = [...new Set(imagesArr.filter(i => Boolean(i)))];

    const updates = {
      name: req.body.name,
      kind: req.body.kind,
      region: req.body.region,
      address: req.body.address,
      description: req.body.description,
      overview: req.body.overview,
      experience: req.body.experience,
      themeColor: req.body.themeColor,
      meta: req.body.meta,
      priceFrom: req.body.priceFrom,
      priceTo: req.body.priceTo,
      openTime: req.body.openTime,
      closeTime: req.body.closeTime,
      openDays: req.body.openDays,
      contactPhone: req.body.contactPhone,
      contactEmail: req.body.contactEmail,
      website: req.body.website,
      lat: req.body.lat,
      lng: req.body.lng,
      image: imagesArr[0] || '',
      images: imagesArr,
      tags: safeParseArray(req, 'tags'),
      amenities: safeParseArray(req, 'amenities'),
      highlights: safeParseArray(req, 'highlights'),
      amusementPlaces: safeParseArray(req, 'amusementPlaces', true),
      accommodations: safeParseArray(req, 'accommodations', true),
      diningPlaces: safeParseArray(req, 'diningPlaces', true),
      checkInSpots: safeParseArray(req, 'checkInSpots', true)
    };
    
    // If a business updates an approved place, it goes back to pending for re-review
    if (req.user.role === 'business') {
      updates.status = 'pending';
    }
    if (req.body.isTour !== undefined) {
      updates.isTour = req.body.isTour === 'true' || req.body.isTour === true;
    }

    Object.assign(place, updates);
    await place.save();
    await syncBusinessXP(req.user.id);
    await logAction('PLACE_UPDATED', `Đã cập nhật địa điểm: ${place.name}`, req);
    res.json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Delete own place
router.delete('/places/:id', businessAuth, async (req, res) => {
  try {
    const place = await Place.findOneAndDelete({ id: req.params.id, ownerId: req.user.id });
    if (!place) return res.status(404).json({ success: false, message: 'Không thể xóa (Không tìm thấy hoặc sai quyền).' });
    await syncBusinessXP(req.user.id);
    res.json({ success: true, message: 'Đã xóa thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Get business messages (Inbox)
router.get('/messages', businessAuth, async (req, res) => {
  try {
    // Get all messages for this business
    const messages = await BusinessMessage.find({ businessId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    
    // Group messages by customerId to create "conversations"
    const conversations = [];
    const customerIds = [...new Set(messages.map(m => m.customerId))];
    
    customerIds.forEach(cId => {
      const customerMsgs = messages.filter(m => m.customerId === cId);
      conversations.push({
        customerId: cId,
        customerName: customerMsgs[0].customerName,
        lastMessage: customerMsgs[0].text,
        time: customerMsgs[0].createdAt,
        unreadCount: customerMsgs.filter(m => !m.isRead && m.senderRole === 'customer').length,
        messages: customerMsgs.reverse() // chronological order for detail view
      });
    });

    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Send message from business
router.post('/messages', businessAuth, async (req, res) => {
  try {
    const { customerId, text, serviceId, customerName } = req.body;
    
    // Validate required fields
    if (!text || !customerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: customerId and text are required' 
      });
    }
    
    // Validate text length
    if (text.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message text cannot be empty' 
      });
    }
    
    if (text.length > 1000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message text is too long (max 1000 characters)' 
      });
    }

    const newMessage = new BusinessMessage({
      businessId: req.user.id,
      customerId,
      customerName: customerName || 'Khách hàng',
      senderRole: 'business',
      text,
      serviceId,
      isRead: true // Business's own messages are "read" by them
    });

    await newMessage.save();
    res.json({ success: true, data: newMessage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Get business leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const topBusinesses = await BusinessAccount.find()
      .sort({ points: -1 })
      .limit(20)
      .select('name displayName points avatar')
      .lean();
    res.json({ success: true, data: topBusinesses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. User → Business chat: GET history
router.get('/:bizId/chat', async (req, res) => {
  try {
    const { auth } = require('./auth');
    // Manual token check (no middleware)
    const token = req.headers['x-auth-token'];
    let userId = null, userName = 'Khách';
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const secret = (process.env.JWT_SECRET || 'wander-viet-secret-key-123').trim();
        const decoded = jwt.verify(token, secret);
        userId = decoded.id; userName = decoded.name || 'Khách';
      } catch(e) {}
    }
    const msgs = await BusinessMessage.find({
      businessId: req.params.bizId,
      ...(userId ? { customerId: userId } : {})
    }).sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: msgs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. User → Business chat: POST message
router.post('/:bizId/chat', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const token = req.headers['x-auth-token'];
    if (!token) return res.status(401).json({ success: false, message: 'Cần đăng nhập' });
    const secret = (process.env.JWT_SECRET || 'wander-viet-secret-key-123').trim();
        const decoded = jwt.verify(token, secret);
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'Tin nhắn rỗng' });
    const msg = new BusinessMessage({
      businessId: req.params.bizId,
      customerId: decoded.id,
      customerName: decoded.name || 'Khách',
      senderRole: 'customer',
      text: text.trim(),
      isRead: false
    });
    await msg.save();
    res.json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. GET /api/business/activities/live — Fetch real-time activities
router.get('/activities/live', businessAuth, async (req, res) => {
  try {
    const { category } = req.query;
    const query = { ownerId: req.user.id };
    if (category && category !== 'all') {
      query.businessCategory = category;
    }

    const activities = await BusinessActivity.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, data: activities });
  } catch (err) {
    console.error('[API Business Live Error]:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// 11. POST /api/business/activities/log — Log a customer activity (called by user-web)
router.post('/activities/log', async (req, res) => {
  try {
    const { placeId, type, details, userId, userName } = req.body;
    // Handle both ObjectId and custom string id
    const place = await Place.findOne({ $or: [{ _id: mongoose.isValidObjectId(placeId) ? placeId : null }, { id: placeId }] });
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
    
    const newActivity = new BusinessActivity({
      placeId,
      placeName: place.name,
      businessCategory: place.businessCategory || 'other',
      ownerId: place.ownerId,
      userId,
      userName: userName || 'Khách vãng lai',
      type,
      details
    });
    
    await newActivity.save();
    res.json({ success: true, data: newActivity });
  } catch (err) {
    console.error('[API Business Log Error]:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// 12. PATCH /api/business/places/:id/category — Update service classification
router.patch('/places/:id/category', businessAuth, async (req, res) => {
  try {
    const { businessCategory } = req.body;
    const place = await Place.findOneAndUpdate(
      { id: req.params.id, ownerId: req.user.id },
      { businessCategory },
      { new: true }
    );
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
    res.json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
