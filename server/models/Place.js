const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  id:            { type: String, unique: true, sparse: true },
  name:          { type: String, required: true },
  slug:          { type: String, unique: true, sparse: true }, // SEO-friendly URL
  kind:          { type: String, enum: ['diem-du-lich', 'trai-nghiem', 'khach-san', 'nha-hang', 'giai-tri', 'tien-ich'], default: 'diem-du-lich' },
  businessCategory: { type: String, enum: ['dining', 'stay', 'tour', 'facility', 'other'], default: 'other' },
  // Tour-specific fields
  isTour:        { type: Boolean, default: false },
  isUtility:     { type: Boolean, default: false },
  tourDuration:  { type: String, default: '' },        // VD: '3N2Đ'
  tourIncludes:  [String],                              // Bao gồm: ăn sáng, xe đón...
  tourGroupSize: { type: Number, default: null },       // Số khách tối đa
  tourDifficulty:{ type: String, enum: ['easy','medium','hard'], default: 'easy' },
  tourItinerary: [{ day: Number, title: String, detail: String }], // Lịch trình theo ngày
  region:        { type: String, default: '' },
  country:       { type: String, default: 'Việt Nam' },
  city:          { type: String, default: '' },
  address:       { type: String, default: '' },
  description:   { type: String, default: '' },
  overview:      { type: String, default: '' },
  highlights:    [String],
  experience:    { type: String, default: '' },
  themeColor:    { type: String, default: '#3b82f6' },
  text:          { type: String, default: '' }, // Legacy, used by some features
  meta:          { type: String, default: '' },
  image:         { type: String, default: '' },
  images:        [String],
  tags:          [String],
  interests:     [String],
  habits:        [String],
  budget:        { type: Number, default: 2 },
  pace:          { type: String, default: 'vua' },
  top:           { type: Boolean, default: false },
  verified:      { type: Boolean, default: false },
  ownerId:       { type: String, default: null },   // userId string from JWT
  status:        { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  source:        { type: String, enum: ['system', 'partner'], default: 'system' },
  rejectionReason: { type: String, default: '' },

  // Business-specific fields
  priceFrom:     { type: Number, default: null },
  priceTo:       { type: Number, default: null },
  averagePrice:  { type: Number, default: null }, // Giá trung bình
  openTime:      { type: String, default: '' },
  closeTime:     { type: String, default: '' },
  openDays:      { type: String, default: '' },
  amenities:     [String],
  contactPhone:  { type: String, default: '' },
  contactEmail:  { type: String, default: '' },
  website:       { type: String, default: '' },

  // NEW: Quick Info fields
  gpsCoordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  visitDuration: { type: String, default: '' }, // Thời gian tham quan trung bình (VD: "2-3 giờ")
  crowdLevel:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }, // Độ đông đúc
  costLevel:     { type: String, enum: ['budget', 'standard', 'luxury'], default: 'standard' }, // Mức chi phí
  suitability:   [String], // Gia đình, Couple, Solo, Group
  bestTimeToVisit: { type: String, default: '' }, // Thời gian đẹp nhất trong ngày
  bestSeason:    { type: String, default: '' }, // Mùa đẹp nhất
  weatherTags:   [String], // Sunny, Rainy, Cool, Hot
  internetQuality: { type: String, enum: ['poor', 'fair', 'good', 'excellent'], default: 'fair' },
  parking:       { type: String, enum: ['none', 'street', 'lot', 'valet'], default: 'none' },
  accessibility:  {
    wheelchairAccessible: { type: Boolean, default: false },
    elevator: { type: Boolean, default: false },
    accessibleRestrooms: { type: Boolean, default: false },
    notes: { type: String, default: '' }
  },
  capacity:      { type: Number, default: null }, // Sức chứa

  // NEW: Gallery/Media System
  gallery: [{
    url: String,
    type: { type: String, enum: ['image', 'video', '360', 'reel'], default: 'image' },
    category: { type: String, enum: ['food', 'nature', 'hotel', 'nightlife', 'beach', 'adventure', 'general'], default: 'general' },
    caption: String,
    uploadedBy: { type: String, default: 'business' }, // 'business' or 'user'
    likes: { type: Number, default: 0 },
    isCover: { type: Boolean, default: false },
    aiDetectedScene: [String], // AI auto-detected scenes
    createdAt: { type: Date, default: Date.now }
  }],
  coverImage:    { type: String, default: '' },
  videoUrl:      { type: String, default: '' },
  reelUrls:      [String], // Short video URLs

  // NEW: Experience System
  experiences: [{
    title: String,
    description: String,
    icon: String, // Emoji or icon name
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
    duration: String,
    priceEstimate: Number,
    bestTime: String,
    requirements: [String],
    highlights: [String]
  }],

  // NEW: Enhanced Itinerary System
  suggestedItineraries: [{
    name: String,
    duration: String, // "1 day", "2 days", "3 days"
    type: { type: String, enum: ['couple', 'family', 'solo', 'group', 'budget', 'luxury'], default: 'general' },
    timeline: [{
      time: String,
      activity: String,
      location: String,
      duration: String,
      cost: Number,
      tips: String,
      description: String,
      image: String
    }],
    totalCostEstimate: Number,
    aiGenerated: { type: Boolean, default: false }
  }],

  // NEW: FAQ System
  faqs: [{
    question: String,
    answer: String,
    helpfulCount: { type: Number, default: 0 },
    createdBy: { type: String, default: 'business' }, // 'business' or 'ai'
    createdAt: { type: Date, default: Date.now }
  }],

  // NEW: Safety & Tips System
  safetyTips: [{
    category: { type: String, enum: ['weather', 'safety', 'scam', 'health', 'general'], default: 'general' },
    title: String,
    description: String,
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  }],
  whatToBring:   [String],
  whatNotToDo:   [String],

  // NEW: Nearby Places System
  nearbyPlaces: [{
    placeId: String,
    name: String,
    type: { type: String, enum: ['restaurant', 'hotel', 'cafe', 'attraction', 'transport'], default: 'attraction' },
    distance: Number, // in meters
    distanceText: String, // "500m", "1km"
    travelTime: String, // "5 min walk", "10 min drive"
    rating: Number
  }],

  // NEW: Cost Estimation System
  costEstimation: {
    budget: {
      ticket: Number,
      food: Number,
      transport: Number,
      accommodation: Number,
      activities: Number,
      total: Number
    },
    standard: {
      ticket: Number,
      food: Number,
      transport: Number,
      accommodation: Number,
      activities: Number,
      total: Number
    },
    luxury: {
      ticket: Number,
      food: Number,
      transport: Number,
      accommodation: Number,
      activities: Number,
      total: Number
    }
  },

  // NEW: SEO System
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    openGraphImage: String,
    schemaMarkup: String, // JSON-LD schema
    seoScore: { type: Number, default: 0 } // 0-100
  },

  // NEW: AI-generated content
  aiSummary:     String, // AI-generated summary
  aiVibe:        String, // AI-detected vibe/mood
  aiTags:        [String], // AI-generated tags

  // NEW: Engagement metrics
  viewsCount:    { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 },
  trendingScore: { type: Number, default: 0 }, // Calculated based on views, engagement, recency

  // Source info
  sourceName:    { type: String, default: '' },
  sourceUrl:     { type: String, default: '' },
  transportTips: { type: String, default: '' },

  // Nested details (kept for backward compat)
  activities: [{ dayPart: String, title: String, tip: String }],
  amusementPlaces: [{
    name: String, image: String,
    rating: { type: Number, default: 0 },
    description: String, ticketPrice: String,
    openingHours: String, address: String
  }],
  accommodations: [{
    name: String, image: String,
    rating: { type: Number, default: 0 },
    description: String, priceRange: String, address: String
  }],
  diningPlaces: [{
    name: String, image: String,
    rating: { type: Number, default: 0 },
    description: String, priceRange: String, address: String
  }],
  checkInSpots: [{
    name: String, image: String,
    rating: { type: Number, default: 0 },
    description: String, address: String
  }],

  // User interaction
  favoritesCount: { type: Number, default: 0 },
  ratingAvg:      { type: String, default: '0' },
  reviewCount:    { type: Number, default: 0 },
  reviews: [{
    userId:    String,
    userName:  { type: String, default: 'Khách' },
    rating:    { type: Number, min: 1, max: 5 },
    text:      String,
    images:    [String], // Review images
    verified:  { type: Boolean, default: false }, // Verified traveler
    helpfulCount: { type: Number, default: 0 },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' }, // AI-detected sentiment
    spamDetected: { type: Boolean, default: false }, // AI spam detection
    createdAt: { type: Date, default: Date.now }
  }],

  // Geographic (legacy, kept for compatibility)
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for fast lookup
placeSchema.index({ region: 1 });
placeSchema.index({ tags: 1 });
placeSchema.index({ name: 'text' });
placeSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Place', placeSchema);
