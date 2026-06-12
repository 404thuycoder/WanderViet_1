const express = require('express');
const router = express.Router();
console.log('✅ [public.js] Route module initialized');
const mongoose = require('mongoose');
const User = require('../models/User');
const Place = require('../models/Place');
const Feedback = require('../models/Feedback');
const BusinessAccount = require('../models/BusinessAccount');
const fs = require('fs');
const path = require('path');

// Memory Cache for static fallback data
let staticPlacesCache = null;
function getPlacesFallback() {
  if (staticPlacesCache) return staticPlacesCache;
  try {
    const filePath = path.join(__dirname, '../../apps/user-web/js/places-data.js');
    const content = fs.readFileSync(filePath, 'utf-8');
    const arrayMatch = content.match(/window\.WANDER_PLACES\s*=\s*(\[[\s\S]*\]);/);
    if (arrayMatch) {
      staticPlacesCache = new Function('return ' + arrayMatch[1])();
      return staticPlacesCache;
    }
  } catch (e) {
    console.error("Error loading places fallback data in public.js:", e);
  }
  return [];
}

// Helper: build safe $or query that avoids CastError for non-ObjectId strings
function buildIdQuery(id) {
  const conditions = [{ customId: id }];
  if (mongoose.Types.ObjectId.isValid(id)) conditions.push({ _id: id });
  return { $or: conditions };
}

// GET /api/public/weather/open-meteo - Proxy for Open-Meteo weather API
router.get('/weather/open-meteo', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng parameters required' });
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.warn('[Weather/Open-Meteo Fallback Mode - Offline or DNS Error]', err.message);
    res.json({
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      current: {
        temperature_2m: 26.0,
        weathercode: 0 // Clear sky
      },
      isFallback: true
    });
  }
});

// GET /api/public/weather/wttr - Proxy for wttr.in weather API
router.get('/weather/wttr', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'q parameter required' });
  }
  try {
    const url = `https://wttr.in/${encodeURIComponent(q)}?format=j1&lang=vi`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.warn('[Weather/wttr.in Fallback Mode - Offline or DNS Error]', err.message);
    res.json({
      current_condition: [
        {
          temp_C: "26",
          weatherCode: "113",
          weatherDesc: [{ value: "Trời quang đãng" }]
        }
      ],
      nearest_area: [
        {
          region: [{ value: q || "Việt Nam" }]
        }
      ],
      isFallback: true
    });
  }
});

// GET /api/public/place-photo - Proxy to get real Google Maps thumbnails or DB images
router.get('/place-photo', async (req, res) => {
  const { name, address } = req.query;
  console.log(`[Photo Proxy] Searching for: ${name}`);
  
  try {
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    // 1. FIRST: Check our own database for an exact match or similar
    const dbPlace = await Place.findOne({ 
      $or: [
        { name: { $regex: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } },
        { name: { $regex: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } }
      ]
    }).select('image images coverImage').lean();

    if (dbPlace && (dbPlace.image || dbPlace.coverImage || (dbPlace.images && dbPlace.images[0]))) {
      const img = dbPlace.image || dbPlace.coverImage || dbPlace.images[0];
      console.log(`[Photo Proxy] Found in DB: ${img}`);
      return res.redirect(img);
    }

    // 2. SECOND: Try Google Maps Scraping (Enhanced)
    // Clean address (remove OSM default placeholders)
    const cleanAddress = (address || '').replace(/Vị trí trên bản đồ|Vị trí chính xác trên bản đồ/g, '').trim();
    const searchQuery = encodeURIComponent(`${name} ${cleanAddress}`);
    const searchUrl = `https://www.google.com/maps/search/${searchQuery}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    const html = await response.text();
    
    // Attempt to extract the photo URL from meta tags or scripts
    // Look for OG Image
    const ogImageMatch = html.match(/<meta content="(https:\/\/lh5\.googleusercontent\.com\/p\/[^"]+)"/);
    if (ogImageMatch) return res.redirect(ogImageMatch[1]);

    // Look for any Google Photos URL in script blocks
    const scriptPhotoMatch = html.match(/https:\/\/lh5\.googleusercontent\.com\/p\/[^"= ]+/);
    if (scriptPhotoMatch) {
      // Clean up the URL (sometimes it has unwanted chars at the end)
      let photoUrl = scriptPhotoMatch[0].split('\\')[0].split('"')[0];
      return res.redirect(photoUrl);
    }

    // 3. THIRD: Fallback to high-quality Unsplash instead of loremflickr
    res.redirect(`https://source.unsplash.com/featured/800x600?${encodeURIComponent(name)},vietnam,travel`);
  } catch (err) {
    console.error('[Photo Proxy Error]', err.message);
    res.redirect('https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80');
  }
});

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
    if (!biz) return res.json({ success: false, message: 'Not found' });
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
    
    if (!biz) return res.json({ success: false, message: 'Doanh nghiệp không tồn tại' });

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
    const id = req.params.id;
    const placeQ = [{ id: id }, { slug: id }];
    if (mongoose.Types.ObjectId.isValid(id)) placeQ.push({ _id: id });
    
    let place = await Place.findOne({ $or: placeQ }).lean();
    let isFromDB = !!place;
    
    // Memory fallback if DB lookup fails or record missing
    if (!place) {
      const placesData = getPlacesFallback(); // Helper to load from places-data.js
      place = placesData.find(p => p.id === id || p.slug === id || p._id === id);
    }
    
    if (!place) return res.json({ success: false, message: 'Không tìm thấy địa điểm' });

    // Lấy thông tin chủ sở hữu (nếu có)
    let owner = null;
    if (place.ownerId) {
      owner = await BusinessAccount.findOne(buildIdQuery(place.ownerId))
        .select('name displayName avatar isVerified customId contactPhone contactEmail');
    }

    // Dùng place trực tiếp (đã .lean() nên là plain object, không có _doc)
    const placeData = place;

    // Tăng viewsCount (hỗ trợ cả ObjectId lẫn custom string ID)
    if (isFromDB && place._id) {
      Place.findByIdAndUpdate(place._id, { $inc: { viewsCount: 1 } }).exec();
    }

    res.json({ success: true, data: { ...placeData, owner } });
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

// GET /api/public/places - Lấy danh sách địa điểm/dịch vụ công khai (có hỗ trợ lọc)
router.get('/places', async (req, res) => {
  try {
    const { ownerId, kind, featured } = req.query;
    const query = { status: 'approved' };
    
    if (ownerId) {
      const ownerConditions = [{ ownerId: ownerId }];
      if (mongoose.Types.ObjectId.isValid(ownerId)) {
        ownerConditions.push({ ownerId: new mongoose.Types.ObjectId(ownerId) });
      }
      query.$or = ownerConditions;
    }
    
    if (kind) query.kind = kind;
    if (featured === 'true') query.top = true;

    const places = await Place.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: places });
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
      let ownerName = 'WanderViet AI Partner';
      let ownerId = null;
      let hasRealBusiness = false;
      let businessData = null;
      
      if (p.ownerId) {
        const owner = await BusinessAccount.findOne(buildIdQuery(p.ownerId)).select('displayName name _id customId avatar bio');
        if (owner) {
            ownerName = owner.displayName || owner.name;
            ownerId = owner.customId || owner._id;
            hasRealBusiness = true;
            businessData = { avatar: owner.avatar, bio: owner.bio };
        } else {
            ownerName = p.ownerName || p.name;
            ownerId = p.ownerId || p._id;
        }
      } else {
        ownerName = p.ownerName || p.name;
        ownerId = p._id;
      }
      
      return { ...p._doc, ownerName, ownerId, hasRealBusiness, businessData };
    }));

    res.json({ success: true, data: enrichedPlaces });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// Helper: Get distance between two points in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helper: Scrape more data from Google Maps search results
async function scrapeGooglePlaceInfo(name, address) {
  try {
    const cleanAddress = (address || '').replace(/Vị trí trên bản đồ|Vị trí chính xác trên bản đồ/g, '').trim();
    const searchQuery = encodeURIComponent(`${name} ${cleanAddress}`);
    const searchUrl = `https://www.google.com/maps/search/${searchQuery}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    const html = await response.text();
    
    // Extract Rating (e.g. "4.5 stars")
    const ratingMatch = html.match(/([\d.,]+)\s*sao|rating\s*of\s*([\d.,]+)/i);
    const rating = ratingMatch ? (ratingMatch[1] || ratingMatch[2]).replace(',', '.') : (4.0 + Math.random() * 0.9).toFixed(1);

    // Extract Review Count
    const reviewsMatch = html.match(/([\d.]+)\s*đánh giá|([\d.]+)\s*reviews/i);
    const reviews = reviewsMatch ? parseInt(reviewsMatch[1] || reviewsMatch[2].replace('.', '')) : Math.floor(Math.random() * 1000) + 100;

    // Extract Photo
    let photo = null;
    const ogImageMatch = html.match(/<meta content="(https:\/\/lh5\.googleusercontent\.com\/p\/[^"]+)"/);
    if (ogImageMatch) photo = ogImageMatch[1];
    else {
      const scriptPhotoMatch = html.match(/https:\/\/lh5\.googleusercontent\.com\/p\/[^"= ]+/);
      if (scriptPhotoMatch) photo = scriptPhotoMatch[0].split('\\')[0].split('"')[0];
    }

    return { rating, reviews, photo };
  } catch (e) {
    return { rating: '4.5', reviews: 100, photo: null };
  }
}

// GET /api/public/nearby-discovery - Advanced discovery merging DB, OSM, and Google
router.get('/nearby-discovery', async (req, res) => {
  try {
    const { lat, lng, types, bounds } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Coordinates required' });

    const radius = 2000; // 2km discovery radius
    const activeTypes = (types || '').split(',').filter(t => t);
    
    // 1. Search Local Database
    const dbPlaces = await Place.find({
      status: 'approved',
      'gpsCoordinates.lat': { $exists: true },
      'gpsCoordinates.lat': { $gte: parseFloat(lat) - 0.05, $lte: parseFloat(lat) + 0.05 },
      'gpsCoordinates.lng': { $gte: parseFloat(lng) - 0.05, $lte: parseFloat(lng) + 0.05 }
    }).limit(20).lean();

    const formattedDB = dbPlaces.map(p => ({
      id: p._id.toString(),
      name: p.name,
      lat: p.gpsCoordinates.lat,
      lng: p.gpsCoordinates.lng,
      address: p.address,
      type: p.kind,
      image: p.image || p.coverImage || (p.images && p.images[0]),
      rating: p.ratingAvg || '5.0',
      reviews: p.reviewCount || 0,
      distanceValue: getDistanceMeters(parseFloat(lat), parseFloat(lng), p.gpsCoordinates.lat, p.gpsCoordinates.lng),
      source: 'wander'
    }));

    // 2. Search Overpass (OSM)
    const osmTags = {
      'restaurant': 'nwr["amenity"~"restaurant|fast_food|food_court|bar|pub|ice_cream|bakery"]',
      'hotel': 'nwr["tourism"~"hotel|guest_house|hostel|motel|apartment|resort"]',
      'cafe': 'nwr["amenity"~"cafe|tea_room"]',
      'attraction': 'nwr["tourism"~"attraction|viewpoint|museum|theme_park|monument|artwork|gallery|zoo|historic"]'
    };

    let osmResults = [];
    const bbox = bounds || `${parseFloat(lat)-0.02},${parseFloat(lng)-0.02},${parseFloat(lat)+0.02},${parseFloat(lng)+0.02}`;
    
    // Call Overpass from server to avoid client rate-limits
    try {
      let queryParts = [];
      activeTypes.forEach(t => { if (osmTags[t]) queryParts.push(osmTags[t] + '(' + bbox + ');'); });
      if (queryParts.length > 0) {
        const query = `[out:json][timeout:30];(${queryParts.join('')});out body center 50;`;
        const osmRes = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query));
        const osmJson = await osmRes.json();
        if (osmJson.elements) {
          osmResults = osmJson.elements.map(el => {
            const tags = el.tags || {};
            const eLat = el.lat || (el.center ? el.center.lat : null);
            const eLng = el.lon || (el.center ? el.center.lon : null);
            const name = tags.name || tags["name:vi"] || "Địa điểm lân cận";
            const addr = tags["addr:full"] || tags["addr:street"] || "Vị trí trên bản đồ";
            return {
              id: 'osm-' + el.id,
              name, lat: eLat, lng: eLng, address: addr,
              type: tags.amenity || tags.tourism || 'other',
              distanceValue: getDistanceMeters(parseFloat(lat), parseFloat(lng), eLat, eLng),
              source: 'osm'
            };
          });
        }
      }
    } catch (e) { console.error('[Discovery] OSM Error:', e.message); }

    // 3. Merge and Enrich top results with Google Data
    let merged = [...formattedDB, ...osmResults].sort((a,b) => a.distanceValue - b.distanceValue);
    
    // Enrich top 8 OSM results with Google Metadata if missing
    const toEnrich = merged.filter(m => m.source === 'osm').slice(0, 8);
    await Promise.all(toEnrich.map(async (m) => {
      const googleData = await scrapeGooglePlaceInfo(m.name, m.address);
      m.rating = googleData.rating;
      m.reviews = googleData.reviews;
      m.image = googleData.photo || `/api/public/place-photo?name=${encodeURIComponent(m.name)}&address=${encodeURIComponent(m.address)}`;
    }));

    res.json({ success: true, data: merged.slice(0, 40) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
