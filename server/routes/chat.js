const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./auth');
const User = require('../models/User');
const Knowledge = require('../models/Knowledge');
const Conversation = require('../models/Conversation');
const chatbotDb = require('../models/dbChatbot');
const fs = require('fs');
const path = require('path');
const Place = require('../models/Place');
const Itinerary = require('../models/Itinerary');

const { callGroq } = require('../utils/groq-rotator');

// Helper để thực hiện call Groq với cơ chế tự động xoay vòng key (Key Rotation) & Fallback model cực mạnh từ rotator dùng chung
async function createGroqChatCompletion(params, isBusiness = false) {
  let category = isBusiness ? 'business' : 'user_chatbot';
  if (params && (params.model === 'llama-3.2-11b-vision' || params.model === 'llama-3.2-11b-vision-preview')) {
    category = 'vision';
  }
  return await callGroq(category, params);
}

// Middleware xác thực tùy chọn
const optionalAuth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded.user || decoded.account || decoded;
    } catch (e) { }
  }
  next();
};

// Nạp danh sách điểm đến để hỗ trợ xác định vị trí (Cache để tăng tốc)
let cachedPlaces = [];
try {
  const placesDataPath = path.join(__dirname, '../../apps/user-web/js/places-data.js');
  const content = fs.readFileSync(placesDataPath, 'utf-8');
  const arrayMatch = content.match(/window\.WANDER_PLACES\s*=\s*(\[[\s\S]*\]);/);
  if (arrayMatch) {
    const arrayStr = arrayMatch[1];
    cachedPlaces = new Function('return ' + arrayStr)();
  }
} catch (e) {
  console.error("Error loading places fallback data:", e);
}

// --- GLOBAL DATA CONSTANTS FOR GEOGRAPHY ---
const PROVINCES = [
  'Hà Nội', 'Hồ Chí Minh', 'Sài Gòn', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Lào Cai', 'Sa Pa', 'Yên Bái', 'Điện Biên', 'Lai Châu', 'Sơn La', 'Hòa Bình', 'Hà Giang', 'Tuyên Quang', 'Cao Bằng', 'Bắc Kạn', 'Thái Nguyên', 'Lạng Sơn', 'Bắc Giang', 'Quảng Ninh', 'Hạ Long', 'Phú Thọ', 'Vĩnh Phúc', 'Bắc Ninh', 'Hải Dương', 'Hưng Yên', 'Thái Bình', 'Hà Nam', 'Nam Định', 'Ninh Bình', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế', 'Huế', 'Quảng Nam', 'Hội An', 'Quảng Ngãi', 'Bình Định', 'Quy Nhơn', 'Phú Yên', 'Khánh Hòa', 'Nha Trang', 'Ninh Thuận', 'Bình Thuận', 'Mũi Né', 'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng', 'Đà Lạt', 'Bình Phước', 'Tây Ninh', 'Bình Dương', 'Đồng Nai', 'Bà Rịa Vũng Tàu', 'Vũng Tàu', 'Long An', 'Tiền Giang', 'Bến Tre', 'Trà Vinh', 'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Kiên Giang', 'Phú Quốc', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau'
];

const LANDMARK_TO_PROVINCE = {
  'văn miếu': 'Hà Nội', 'quốc tử giám': 'Hà Nội', 'hoàn kiếm': 'Hà Nội', 'hồ gươm': 'Hà Nội',
  'ba đình': 'Hà Nội', 'chùa một cột': 'Hà Nội', 'lăng bác': 'Hà Nội', 'tây hồ': 'Hà Nội',
  'đông anh': 'Hà Nội', 'bát tràng': 'Hà Nội', 'thăng long': 'Hà Nội',
  'sơn trà': 'Đà Nẵng', 'ngũ hành sơn': 'Đà Nẵng', 'bà nà': 'Đà Nẵng',
  'phố cổ': 'Hội An', 'chùa cầu': 'Hội An',
  'tháp bà': 'Nha Trang', 'vinpearl': 'Nha Trang',
  'dinh độc lập': 'Hồ Chí Minh', 'bến thành': 'Hồ Chí Minh',
  'bãi sao': 'Phú Quốc', 'cáp treo hòn thơm': 'Phú Quốc',
  'tràng an': 'Ninh Bình', 'tam cốc': 'Ninh Bình', 'bích động': 'Ninh Bình',
  'fansipan': 'Sa Pa', 'ruộng bậc thang': 'Sa Pa',
  'đỉnh bà đen': 'Tây Ninh',
  'núi bà rá': 'Bình Phước',
  'hang sơn đoòng': 'Quảng Bình', 'phong nha': 'Quảng Bình',
};

// --- HELPER: GET LOCAL PLACES CONTEXT FROM DATABASE & FALLBACK ---
async function getLocalPlacesContext(dest) {
  if (!dest || dest.length < 2) return "";
  let info = [];
  
  // 1. Search in DB Place
  try {
    const dbPlaces = await Place.find({
      isDeleted: { $ne: true },
      status: 'approved',
      $or: [
        { region: new RegExp(dest, 'i') },
        { name: new RegExp(dest, 'i') }
      ]
    }).limit(10).lean();
    
    if (dbPlaces && dbPlaces.length > 0) {
      info.push("--- CÁC ĐỊA ĐIỂM/DỊCH VỤ THỰC TẾ TỪ HỆ THỐNG WANDERVIET ---");
      dbPlaces.forEach(p => {
        let pType = p.isTour ? 'Tour' : (p.kind === 'khach-san' || p.businessCategory === 'stay' ? 'Khách sạn' : (p.kind === 'nha-hang' || p.businessCategory === 'dining' ? 'Nhà hàng' : 'Điểm tham quan/Dịch vụ'));
        info.push(`- [${pType}] Tên: ${p.name} | Vùng: ${p.region} | Giá: ${p.priceFrom ? p.priceFrom.toLocaleString('vi-VN') + 'đ' : 'Liên hệ'} | Mô tả: ${p.description || p.text || 'Chưa có mô tả'}`);
      });
    }
  } catch (err) {
    console.warn("Lỗi truy vấn Place trong getLocalPlacesContext:", err.message);
  }

  // 2. Search in cachedPlaces fallback
  try {
    const localMatches = cachedPlaces.filter(p => 
      p.name.toLowerCase().includes(dest.toLowerCase()) || 
      p.region.toLowerCase().includes(dest.toLowerCase())
    );
    
    if (localMatches && localMatches.length > 0) {
      info.push("--- DANH LAM THẮNG CẢNH VÀ ĐỊA DANH NỔI TIẾNG TẠI ĐỊA PHƯƠNG ---");
      localMatches.forEach(p => {
        info.push(`- Tên địa danh: ${p.name} | Vùng: ${p.region} | Giới thiệu: ${p.text || ''}`);
        if (p.activities && p.activities.length > 0) {
          const actStrs = p.activities.map(a => `${a.dayPart}: ${a.title}`).join('; ');
          info.push(`  Hoạt động đề xuất: ${actStrs}`);
        }
        if (p.amusementPlaces && p.amusementPlaces.length > 0) {
          info.push(`  Khu vui chơi/Tham quan: ${p.amusementPlaces.map(a => a.name).join(', ')}`);
        }
        if (p.diningPlaces && p.diningPlaces.length > 0) {
          info.push(`  Quán ăn đề xuất: ${p.diningPlaces.map(d => d.name).join(', ')}`);
        }
        if (p.checkInSpots && p.checkInSpots.length > 0) {
          info.push(`  Điểm check-in: ${p.checkInSpots.map(c => c.name).join(', ')}`);
        }
      });
    }
  } catch (err) {
    console.warn("Lỗi lọc cachedPlaces trong getLocalPlacesContext:", err.message);
  }

  return info.join('\n');
}

// --- HELPER: GENERATE RESPONSE METADATA (PROPOSALS, DISCOVERY, TOURS) ---
async function generateResponseMetadata(message, aiAnswer, locationContext, isItineraryRequest = false) {
  // Ensure isItineraryRequest is always boolean (prevent 0/null being truthy/falsy)
  const itinReq = isItineraryRequest === true;

  let proposal = null;
  let discoveryPlaces = null;
  let suggestedTours = null;

  const safeAnswer = (typeof aiAnswer === 'string' && aiAnswer.length > 0) ? aiAnswer : '';
  const lowerAnswer = safeAnswer.toLowerCase();
  const lowerUserMsg = message.toLowerCase();
  const weatherKeywords = ['thời tiết', 'mát', 'đẹp trời', 'nắng', 'đi chơi', 'thoi tiet', 'dep troi', 'di choi'];
  const isWeatherContext = weatherKeywords.some(k => lowerUserMsg.includes(k));

  // 1. Tự động nhận diện Tỉnh/Thành/Địa điểm được hỏi
  // Ưu tiên: trích xuất tên địa danh/di tích CỤ THỂ từ message
  let specificLandmark = null;
  for (const [kw, prov] of Object.entries(LANDMARK_TO_PROVINCE)) {
    if (lowerUserMsg.includes(kw)) {
      specificLandmark = kw; // giữ nguyên tên landmark gốc
      break;
    }
  }

  let detectedDest = null;
  if (specificLandmark) {
    detectedDest = LANDMARK_TO_PROVINCE[specificLandmark];
  } else {
    // ƯU TIÊN 1: Tìm trong câu hỏi của người dùng trước
    for (const p of PROVINCES) {
      if (lowerUserMsg.includes(p.toLowerCase())) {
        detectedDest = p;
        break;
      }
    }
    // ƯU TIÊN 2: ĐÃ BỎ - KHÔNG lấy detectedDest từ câu trả lời AI
    // ƯU TIÊN 3: Dùng Regex bắt các địa danh cấp huyện (như Sóc Sơn) không có trong list tỉnh thành
    if (!detectedDest) {
       let destMatch = lowerUserMsg.match(/(?:ở|tại|đến|đi|cho|tìm|về)\s+([a-zà-ỹ]+(?:\s[a-zà-ỹ]+){1,3})/i);
       if (destMatch) {
           const captured = destMatch[1].trim();
           // ⚠️ Validate: chỉ chấp nhận nếu captured MATCH tỉnh thành hoặc landmark thực sự
           const isValidProvince = PROVINCES.some(p => p.toLowerCase() === captured || p.toLowerCase().includes(captured) || captured.includes(p.toLowerCase()));
           const isValidLandmark = Object.keys(LANDMARK_TO_PROVINCE).some(lm => lm === captured || captured.includes(lm));
           const badDests = ['trình', 'kế hoạch', 'đi', 'đến', 'này', 'nhé', 'đó', 'đây', 'chơi', 'giúp', 'cho', 'nha', 'chuyến', 'với', 'nhé', 'điểm', 'diem', 'tour', 'dịch vụ', 'khách sạn', 'đâu', 'đâu không', 'gì', 'anh hùng', 'chiến tranh', 'lịch sử', 'văn hóa', 'bác hồ', 'hồ chí minh', 'việt nam', 'các', 'vị', 'viet nam'];
           if (!badDests.includes(captured) && captured.length > 2 && (isValidProvince || isValidLandmark)) {
               detectedDest = captured;
               console.log(`[DEBUG Meta] detectedDest from regex: "${captured}" (validProvince=${isValidProvince}, validLandmark=${isValidLandmark})`);
           }
       }
    }
  }

  // 2. Tự động nhận diện Style/Thể loại du lịch từ USER MESSAGE (không từ AI answer)
  // ⚠️ Chỉ detect từ message của người dùng để tránh AI answer gây nhiễu
  // ⚠️ LOẠI TRỪ các từ mang tính hỏi-đáp kiến thức (lịch sử, văn hóa, di tích) vì chúng làm sai ngữ cảnh discovery
  let detectedTags = [];
  if (lowerUserMsg.includes('biển') || lowerUserMsg.includes('đảo')) {
    detectedTags.push('biển');
  }
  if (lowerUserMsg.includes('núi') || lowerUserMsg.includes('trekking') || lowerUserMsg.includes('leo núi')) {
    detectedTags.push('leo núi');
  }
  if (lowerUserMsg.includes('ẩm thực') || lowerUserMsg.includes('ăn uống') || lowerUserMsg.includes('đặc sản')) {
    detectedTags.push('ẩm thực');
  }
  if (lowerUserMsg.includes('nghỉ dưỡng') || lowerUserMsg.includes('resort')) {
    detectedTags.push('nghỉ dưỡng');
  }
  // ⚠️ KHÔNG detect 'văn hóa', 'lịch sử', 'di tích', 'phố cổ', 'chùa', 'đền' vào detectedTags
  // Vì user hỏi "lịch sử VN" → hiển thị câu trả lời kiến thức, KHÔNG hiển thị discovery places về chùa/di tích

  // A. Tự tạo Proposal (Lịch trình nhanh) - tạo khi itinReq=true (không cần AI text phải chứa keyword)
  if (itinReq) {
      if (isWeatherContext) {
          proposal = {
              destination: detectedDest || locationContext || "vùng lân cận",
              days: 1,
              budget: "Dưới 1 triệu VNĐ",
              style: "Dạo phố & Ngắm cảnh",
              description: "Trời đẹp thế này, làm một chuyến dạo quanh thành phố thì tuyệt vời!",
              title: "Chuyến đi ngẫu hứng ngày đẹp trời"
          };
      } else if (detectedDest) {
          const daysMatch = message.match(/(\d+)\s*(?:ngày|ngay)/i);
          proposal = {
              destination: detectedDest,
              days: daysMatch ? parseInt(daysMatch[1]) : 3,
              budget: message.match(/(\d+)\s*(?:triệu|tr)/i) ? `${message.match(/(\d+)\s*(?:triệu|tr)/i)[1]} triệu VNĐ` : "5 triệu VNĐ",
              style: "Khám phá",
              description: `Hành trình khám phá ${detectedDest} đầy ắp kỷ niệm.`
          };
      }
  }

  // B. Trích xuất Discovery (Địa điểm gợi ý) - LỌC CHÍNH XÁC DUY NHẤT ĐỊA ĐIỂM PHÙ HỢP
  let localPlaceMatch = null;
  if (specificLandmark) {
    localPlaceMatch = cachedPlaces.find(p => p.name.toLowerCase().includes(specificLandmark.toLowerCase()));
  }

  if (localPlaceMatch) {
    // Nếu có địa danh cụ thể trong local, CHỈ hiển thị đúng địa danh đó! (Hỏi đâu trả lời đấy)
    discoveryPlaces = [localPlaceMatch];
  } else if (specificLandmark) {
    // Nếu không tìm thấy địa danh cụ thể này trong local, ta BẮT BUỘC dùng External Fallback để trả về Google Search chính xác cho địa danh đó
    const searchTopic = specificLandmark.replace(/\b\w/g, c => c.toUpperCase());
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTopic + ' địa điểm du lịch')}`;
    discoveryPlaces = [{
        id: "external-google-search",
        name: `🔍 ${searchTopic}`,
        region: "Tìm trên Google",
        image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80",
        externalUrl: googleUrl
    }];
  } else {
    // Nếu là câu hỏi chung chung về tỉnh thành/thể loại, ta lọc local
    // ⚠️ CHỈ check USER MESSAGE, không dùng AI answer để tránh AI tự ý trigger discovery
    // CHỈ hiện discovery khi: user hỏi về địa điểm CỤ THỂ HOẶC thời tiết HOẶC greeting ngắn
    // KHÔNG hiện discovery khi user hỏi chung chung (lịch sử, văn hóa, kiến thức...)
    const userAskedAboutPlace = detectedDest || specificLandmark;
    const isShortGreeting = lowerUserMsg.length < 15 && ['alo', 'chào', 'hi', 'hello', 'xin chào', 'chào bạn', 'cảm ơn'].some(k => lowerUserMsg.includes(k));
    const shouldShowDiscovery = !!(userAskedAboutPlace || isWeatherContext || isShortGreeting);
    // ⚠️ KHÔNG hiện discovery nếu câu hỏi về người/concept (hỏi "có ai", "là gì", "bao nhiêu" kèm tên địa điểm)
    const questionPatterns = ['có .+ nào', 'là gì', 'bao nhiêu', 'ai là', 'ở đâu', 'ra đời', 'sinh ngày', 'có gì', 'cần gì'];
    const isQuestionAboutConcept = questionPatterns.some(p => lowerUserMsg.match(new RegExp(p)));
    const suppressDiscovery = isQuestionAboutConcept && detectedDest && !specificLandmark;
    
    if (shouldShowDiscovery && !suppressDiscovery) {
      let filtered = cachedPlaces;
      
      if (detectedDest) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(detectedDest.toLowerCase()) || 
          p.region.toLowerCase().includes(detectedDest.toLowerCase())
        );
      }

      if (detectedTags.length > 0) {
        filtered = filtered.filter(p => 
          p.tags && p.tags.some(t => detectedTags.includes(t))
        );
      }

      discoveryPlaces = filtered.slice(0, 5);

      if (discoveryPlaces.length === 0) {
          // CHỈ fallback về TOP places nếu KHÔNG có detectedDest VÀ (câu ngắn hoặc lời chào)
          if (!detectedDest && (lowerUserMsg.length < 15 || ['alo', 'chào', 'hi', 'hello'].some(k => lowerUserMsg.includes(k)))) {
              discoveryPlaces = cachedPlaces.filter(p => p.top).slice(0, 5);
          } else {
              discoveryPlaces = []; // Khóa chặt: Đã hỏi địa danh cụ thể mà không có trong thẻ thì tuyệt đối không mọc ra đề xuất Phú Quốc, Hạ Long lung tung
          }
      }
    }
  }

  // C. Tìm kiếm Dịch vụ/Tour có sẵn trong Database - LỌC PHÙ HỢP HOÀN TOÀN NGỮ CẢNH
  // Tìm kiếm khi người dùng hỏi về tour, dịch vụ hoặc đang lên kế hoạch
  const tourKeywords = ['tour', 'gói tour', 'tour trọn gói', 'gói du lịch', 'đặt tour', 'goi tour', 'tour tron goi', 'goi du lich', 'dat tour'];
  const serviceKeywords = ['dịch vụ', 'khách sạn', 'nhà hàng', 'resort', 'homestay', 'chỗ nghỉ', 'quán ăn', 'dich vu', 'khach san', 'nha hang', 'cho nghi', 'quan an', 'chuyến đi', 'chuyen di'];
  
  let wantsTour = tourKeywords.some(k => lowerUserMsg.includes(k));
  let wantsService = serviceKeywords.some(k => lowerUserMsg.includes(k));
  let searchDest = detectedDest || (proposal ? proposal.destination : null);

  if (wantsTour || wantsService) {
    try {
        if (searchDest && searchDest.length > 2) {
            // --- ƯU TIÊN 0: Nếu có landmark cụ thể (Quốc Tử Giám, Văn Miếu...) → tìm CHÍNH XÁC theo tên landmark ---
            // Tránh tìm cả tỉnh Hà Nội khi người dùng chỉ hỏi về 1 địa danh cụ thể
            let effectiveDest = searchDest;
            if (specificLandmark) {
                effectiveDest = specificLandmark; // Tìm theo tên landmark, không phải tỉnh
            }
            const destQuery = {
                isDeleted: { $ne: true },
                status: 'approved',
                $or: [
                    { region: new RegExp(effectiveDest, 'i') },
                    { name: new RegExp(effectiveDest, 'i') }
                ]
            };
            suggestedTours = await Place.find(destQuery).limit(5).lean();
            console.log(`[Tour Search] Dest="${effectiveDest}" (landmark=${!!specificLandmark}) → found ${suggestedTours.length} results`);

            // --- ƯU TIÊN 2: Nếu không tìm theo địa danh được, thử theo tags ---
            if (suggestedTours.length === 0 && detectedTags.length > 0) {
                let tagConds = [];
                detectedTags.forEach(tag => {
                    tagConds.push({ kind: new RegExp(tag, 'i') });
                    tagConds.push({ businessCategory: new RegExp(tag, 'i') });
                    tagConds.push({ name: new RegExp(tag, 'i') });
                });
                suggestedTours = await Place.find({
                    isDeleted: { $ne: true },
                    status: 'approved',
                    $or: tagConds
                }).limit(5).lean();
                console.log(`[Tour Search] Tags fallback → found ${suggestedTours.length} results`);
            }

            // --- CUỐI CÙNG: Nếu vẫn không có, trả về mảng rỗng (không fallback bừa) ---
            if (suggestedTours.length === 0) {
                console.log(`[Tour Search] No results for "${searchDest}" — returning empty (no random fallback).`);
                suggestedTours = [];
            }
        } else if (detectedTags.length > 0) {
            // Chỉ hiện tour/services có trong DB theo tags
            let tagConds = [];
            detectedTags.forEach(tag => {
                tagConds.push({ kind: new RegExp(tag, 'i') });
                tagConds.push({ businessCategory: new RegExp(tag, 'i') });
                tagConds.push({ name: new RegExp(tag, 'i') });
            });
            suggestedTours = await Place.find({
                isDeleted: { $ne: true },
                status: 'approved',
                kind: { $in: ['tour', 'dich-vu', 'service'] },
                $or: tagConds
            }).limit(5).lean();
            console.log(`[Tour Search] Tags only → found ${suggestedTours.length} results`);
        } else if (wantsTour || wantsService) {
            // CHỈ hiện khi hỏi tour/dịch vụ chung mà CÓ results trong DB
            // KHÔNG có fallback "top places" vì đó là place cards không phải tour/services
            const genericQ = {
                isDeleted: { $ne: true },
                status: 'approved',
                kind: { $in: ['tour', 'dich-vu', 'service'] }
            };
            suggestedTours = await Place.find(genericQ).sort({ favoritesCount: -1 }).limit(5).lean();
            console.log(`[Tour Search] Generic tour/service → found ${suggestedTours.length} results`);
        }
    } catch (tourErr) {
        console.error("Error fetching suggested services:", tourErr);
    }

    if (!suggestedTours) {
        suggestedTours = [];
    }
  }

  console.log(`[Metadata] Suggested Services/Tours count: ${suggestedTours ? suggestedTours.length : 0}`);
  console.log(`[DEBUG Meta] OUTPUT: proposal=${!!proposal}, discoveryPlaces=${discoveryPlaces ? discoveryPlaces.length : 0}, suggestedTours=${suggestedTours ? suggestedTours.length : 0}`);

  // GỬI LINK TRỰC TIẾP THAY GOOGLE SEARCH KHI KHÔNG CÓ TOUR TRONG DB
  // Luôn gửi link hữu ích khi user hỏi về tour/dịch vụ
  let suggestedLink = null;

  if (wantsTour) {
    // Ưu tiên: search trực tiếp theo tên địa điểm trên Viator (chuyên tour & hoạt động)
    const searchName = searchDest || 'Vietnam';
    const viatorUrl = `https://www.viator.com/search/${encodeURIComponent(searchName + ' tours activities')}`;
    if (searchDest) {
      suggestedLink = {
        type: 'external',
        label: `🗺️ Tour & hoạt động tại ${searchDest} (Viator)`,
        url: viatorUrl,
        source: 'viator'
      };
    } else if (detectedTags.includes('biển')) {
      suggestedLink = {
        type: 'external',
        label: '🌊 Tour biển & đảo hot nhất Việt Nam',
        url: 'https://www.viator.com/search/Vietnam+beach+island+tours',
        source: 'viator'
      };
    } else if (detectedTags.includes('leo núi')) {
      suggestedLink = {
        type: 'external',
        label: '⛰️ Tour leo núi & trekking Việt Nam',
        url: 'https://www.viator.com/search/Vietnam+trekking+mountain+tours',
        source: 'viator'
      };
    } else {
      suggestedLink = {
        type: 'external',
        label: '🎯 Tour & hoạt động hàng đầu Việt Nam',
        url: 'https://www.viator.com/search/Vietnam+tours+activities',
        source: 'viator'
      };
    }
  } else if (wantsService) {
    // Dịch vụ: dùng Klook (chuyên booking dịch vụ, khách sạn, ẩm thực)
    if (searchDest) {
      const svcType = lowerUserMsg.includes('khách sạn') || lowerUserMsg.includes('homestay') || lowerUserMsg.includes('resort') ? 'hotels' :
                      lowerUserMsg.includes('nhà hàng') || lowerUserMsg.includes('quán ăn') || lowerUserMsg.includes('ẩm thực') ? 'restaurants' : 'activities';
      suggestedLink = {
        type: 'external',
        label: `🏨 Dịch vụ & lưu trú tại ${searchDest} (Klook)`,
        url: `https://www.klook.com/en-US/search/${encodeURIComponent(searchDest)}/${svcType}/`,
        source: 'klook'
      };
    } else {
      suggestedLink = {
        type: 'external',
        label: '🔍 Dịch vụ du lịch tốt nhất Việt Nam (Klook)',
        url: 'https://www.klook.com/en-US/city/34/vietnam/',
        source: 'klook'
      };
    }
  }

  return { proposal, discoveryPlaces, suggestedTours, suggestedLink };
}

function createDefaultFallbackPlan(dest, days, budget, styleObj) {
  const itinerary = [];
  for (let d = 1; d <= days; d++) {
    itinerary.push({
      day: String(d),
      highlight: `Khám phá các địa danh nổi tiếng tại ${dest}`,
      activities: [
        {
          time: "08:00",
          session: "Sáng",
          task: `Ăn sáng đặc sản địa phương và tham quan thắng cảnh tại ${dest}`,
          location: `${dest} Discovery`,
          address: `Trung tâm ${dest}`,
          cost: "50.000đ",
          transport: "Xe máy",
          rating: 4.5,
          description: `Bắt đầu ngày thứ ${d} khám phá vẻ đẹp tự nhiên và văn hóa đặc trưng của ${dest}.`,
          visualNote: "Góc check-in đẹp",
          transitToNext: "Di chuyển bằng phương tiện cá nhân"
        },
        {
          time: "12:00",
          session: "Trưa",
          task: `Thưởng thức ẩm thực trưa đặc sản vùng miền tại ${dest}`,
          location: `Nhà hàng đặc sản ${dest}`,
          address: `${dest}`,
          cost: "150.000đ",
          transport: "Xe máy",
          rating: 4.6,
          description: "Thưởng thức các món ngon truyền thống được chế biến từ nguyên liệu tươi ngon của địa phương.",
          visualNote: "Bàn ăn view đẹp",
          transitToNext: "Nghỉ ngơi và di chuyển chiều"
        },
        {
          time: "18:00",
          session: "Tối",
          task: `Đi dạo chợ đêm hoặc cafe chill tối tại ${dest}`,
          location: `Phố đi bộ / Cafe trung tâm ${dest}`,
          address: `${dest}`,
          cost: "100.000đ",
          transport: "Đi bộ",
          rating: 4.5,
          description: `Tận hưởng không khí mát mẻ về đêm và nhịp sống thanh bình tại ${dest}.`,
          visualNote: "Không gian lãng mạn",
          transitToNext: "Về khách sạn nghỉ ngơi"
        }
      ]
    });
  }

  return {
    tripSummary: `Hành trình ${styleObj.title} tại ${dest} trong ${days} ngày được thiết kế tối ưu, giúp bạn có những trải nghiệm tuyệt vời và đáng nhớ nhất.`,
    estimatedCost: `${budget} triệu VNĐ`,
    emotionalTone: "Hào hứng",
    accommodationSuggestion: {
      typeLabel: styleObj.accommodation,
      icon: "🏨",
      nameAndCost: `Khách sạn / Homestay đề xuất tại ${dest} - 500.000đ/đêm`,
      reason: "Vị trí thuận tiện di chuyển, dịch vụ tốt và được đánh giá cao."
    },
    itinerary
  };
}

router.post('/', optionalAuth, async (req, res) => {
  let clientDisconnected = false;
  req.on('close', () => {
    clientDisconnected = true;
  });

  try {
    const { message: rawMessage, coords, itinerary, activeTrip, deviceId, role, sessionId, placeContext, images } = req.body;
    const message = rawMessage || "";
    let currentSessionId = sessionId;

    const itineraryKeywords = [
      'lên lịch', 'lập lịch', 'tạo lịch', 'lên kế hoạch', 'lịch trình', 'itinerary', 'hành trình cho', 'đặt lịch', 'thiết kế chuyến', 'tạo chuyến', 'lên plan', 'plan chuyến',
      'len lich', 'lap lich', 'tao lich', 'len ke hoach', 'lich trinh', 'hanh trinh cho', 'dat lich', 'thiet ke chuyen', 'tao chuyen', 'len plan', 'plan chuyen',
      'đổi lịch', 'đổi điểm', 'đổi địa điểm', 'tạo lại lịch', 'làm lại lịch', 'thay điểm',
      'doi lich', 'doi diem', 'doi dia diem', 'tao lai lich', 'lam lai lich', 'thay diem',
      'đi đâu', 'chơi gì', 'di dau', 'choi gi', 'muốn đi', 'muon di', 'cho mình đi', 'cho minh di'
    ];

    if (!message && (!images || images.length === 0)) {
      return res.status(400).json({ success: false, answer: 'Vui lòng nhập câu hỏi hoặc gửi hình ảnh.' });
    }

    // Định danh người dùng/phiên
    const sessionKey = req.user ? req.user.id : (deviceId || 'anonymous_guest');
    const targetLang = req.body.lang || 'auto';
    const scope = req.body.scope || 'user_portal';

    // --- QUICK RESPONSE ---
    const lowerMsg = message.toLowerCase().trim().replace(/[?.,!]$/, "");
    const quickGreetings = ['alo', 'chào', 'hi', 'hello', 'ơi', 'ê', 'hey', 'ê hả', 'xin chào', 'hi soul', 'hello wander', 'annyeonghaseyo', 'bonjour', 'konnichiwa', 'ni hao'];

    if (quickGreetings.includes(lowerMsg)) {
      const isVietnameseIntent = (targetLang === 'vi') || (targetLang === 'auto' && ['alo', 'chào', 'ơi', 'ê', 'ê hả', 'xin chào'].includes(lowerMsg));

      if (isVietnameseIntent) {
        const answer = "Chào bạn! Mình là Trợ lý du lịch WanderViet AI đây. Bạn cần mình tư vấn địa điểm nào hay có thắc mắc gì về chuyến đi không?";
        
        if (chatbotDb.readyState === 1 && !clientDisconnected) {
          if (!currentSessionId) currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          let title = message.split(' ').slice(0, 5).join(' ');
          
          // Non-blocking save to database
          Promise.all([
            new Conversation({ userId: sessionKey, sessionId: currentSessionId, title: title, role: 'user', text: message }).save(),
            new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'model', text: answer }).save()
          ]).catch(err => console.error("Lỗi lưu DB Quick Response:", err.message));
        }

        return res.json({
          success: true,
          answer: answer,
          sessionId: currentSessionId,
          source: 'quick-response'
        });
      }
    }

    // 1. Phân tích Lịch sử hội thoại & Profile người dùng từ SERVER song song
    let chatHistory = [];
    let fullUser = null;
    try {
      const dbPromises = [];
      if (chatbotDb.readyState === 1 && currentSessionId) {
        dbPromises.push(
          Conversation.find({ sessionId: currentSessionId })
            .sort({ timestamp: -1 })
            .limit(20)
            .then(recentLogs => {
              if (recentLogs && recentLogs.length > 0) {
                chatHistory = recentLogs.reverse().map(log => ({
                  role: log.role === 'user' ? 'user' : 'assistant',
                  content: log.text
                }));
              }
            })
        );
      }
      if (req.user && req.user.id) {
        dbPromises.push(
          User.findById(req.user.id)
            .select('preferenceProfile')
            .then(u => {
              fullUser = u;
            })
        );
      }
      if (dbPromises.length > 0) {
        await Promise.all(dbPromises);
      }
    } catch (err) {
      console.warn("⚠️ Lỗi truy xuất lịch sử/profile song song:", err.message);
    }

    // 2. Xử lý ngữ cảnh hành trình & vị trí sớm để dùng cho các luồng kế tiếp
    let tripContext = "Khách đang khám phá tự do.";
    if (itinerary && itinerary.length > 0) {
      const stops = itinerary.map(s => s.name || s).join(' -> ');
      tripContext = `Khách đang đi theo chuyến: "${activeTrip || 'Hành trình thông minh'}". Lộ trình dự kiến: ${stops}.`;
    }

    let locationContext = "Chưa xác định rõ vị trí GPS.";
    if (coords && coords.lat && coords.lng) {
      const nearest = cachedPlaces.find(p => {
        const d = Math.sqrt(Math.pow(p.lat - coords.lat, 2) + Math.pow(p.lng - coords.lng, 2));
        return d < 0.5;
      });
      if (nearest) locationContext = `Vị trí hiện tại: ${nearest.name} (${nearest.region}). Đặc tả: ${nearest.text}.`;
    }

    // 3. Trích xuất địa danh dự kiến (candidate destination) từ tin nhắn hoặc lịch sử để truy vấn DB trước
    let candidateDest = null;
    const lowerUserMsg = message.toLowerCase();
    
    for (const [kw, prov] of Object.entries(LANDMARK_TO_PROVINCE)) {
      if (lowerUserMsg.includes(kw)) {
        candidateDest = prov;
        break;
      }
    }
    if (!candidateDest) {
      for (const p of PROVINCES) {
        if (lowerUserMsg.includes(p.toLowerCase())) {
          candidateDest = p;
          break;
        }
      }
    }
    if (!candidateDest && chatHistory.length > 0) {
      const knownRegions = [...new Set(cachedPlaces.map(p => p.region))].concat(['Tuyên Quang', 'Hà Giang', 'Hà Tuyên', 'Bắc Giang', 'Phú Thọ', 'Yên Bái', 'Vĩnh Phúc', 'Thái Nguyên', 'Bắc Kạn']);
      for (let i = chatHistory.length - 1; i >= 0; i--) {
        const text = chatHistory[i].content.toLowerCase();
        let foundRegion = null;
        for (const region of knownRegions) {
          if (region && text.includes(region.toLowerCase())) {
            if (!foundRegion || region.length > foundRegion.length) {
              foundRegion = region;
            }
          }
        }
        if (foundRegion) {
          candidateDest = foundRegion;
          break;
        }
      }
    }

    // ═════ SEMANTIC INTENT CLASSIFIER & DB PRE-FETCHING (PARALLEL EXECUTION) ═════
    let semanticIntent = {
      isSensitive: false,
      isOffTopic: false,
      isItineraryRequest: false,
      destination: null,
      days: null,
      budget: null
    };

    let parsedSemantic = null;
    let knowledgeMatch = null;
    let preFetchedWiki = null;
    let preFetchedTourCount = -1;
    let isTimeSensitive = false;

    try {
      const parallelTasks = [];

      // Task A: Semantic intent parser LLM call (8B model)
      if (scope === 'user_portal' && !placeContext && (!images || images.length === 0)) {
        const semanticMessages = [
          {
            role: 'system',
            content: `Bạn là bộ não phân tích ý định người dùng của hệ thống WanderViet AI - nền tảng du lịch Việt Nam.
Hãy phân tích NGỮ CẢNH TOÀN VẸN, không đọc từng từ riêng lẻ. Dựa trên lịch sử hội thoại (nếu có) để hiểu rõ ngữ cảnh của tin nhắn mới nhất.

QUY TẮC QUAN TRỌNG NHẤT (BẮT BUỘC):
- Nếu tin nhắn mới nhất liên quan đến chủ đề du lịch, văn hóa, danh lam thắng cảnh, ẩm thực, đặc sản, khách sạn, di tích lịch sử hoặc địa lý Việt Nam → isOffTopic PHẢI là false.
- LỜI CHÀO & GIAO TIẾP BAN ĐẦU (GREETINGS/SOCIAL STARTERS): Mọi câu chào hỏi, làm quen xã giao (kể cả viết tắt, viết sai chính tả, không dấu như: "helo", "heloo", "hiii", "xin chao", "chao ban", "chao ad", "ad oi", "alo", "chao", "hello", "hi", "hey", v.v.) → isOffTopic BẮT BUỘC PHẢI là false. Lời chào xã giao bắt đầu câu chuyện là hợp lệ.
- ĐẶC BIỆT CHÚ Ý NGỮ CẢNH LỊCH SỬ CHAT:
  + Nếu tin nhắn là câu tiếp nối, đính chính, sửa lỗi hoặc phản hồi cho câu trả lời trước đó của trợ lý (ví dụ: "sai rồi, phải là...", "cập nhật câu trên vào đi", "tổ chức ở đâu", "tại sao vậy", "đâu em", "ở đâu vậy", v.v.) liên quan đến một chủ đề du lịch/lịch sử/vị trí địa lý đã thảo luận ở trên → isOffTopic PHẢI là false.
  + Nếu tin nhắn chứa các từ ngữ ngắn hoặc đại từ chỉ định ("câu trên", "nơi đó", "ở đây", "chỗ này", "này", "vậy", "đó") tham chiếu tới nội dung đang chat → isOffTopic PHẢI là false.
  + Kể cả người dùng có viết sai chính tả, viết tắt, không dấu, hoặc diễn đạt lệch đi nhưng có thể suy luận ngữ cảnh đang nói về du lịch/lịch sử Việt Nam → isOffTopic PHẢI là false.
- QUY TẮC BẮT BUỘC VỀ THÔNG TIN ĐIỂM XUẤT PHÁT / CHỈNH SỬA LỊCH TRÌNH:
  + Nếu người dùng cung cấp thêm thông tin về điểm xuất phát, điểm đi từ, phương tiện di chuyển hoặc chỉnh sửa nhỏ cho lịch trình đang thảo luận (ví dụ: "tôi bắt đầu đi từ Hà Nội", "đi bằng xe máy", "không lấy khách sạn") → isItineraryRequest PHẢI là false, vì đây chỉ là thông tin bổ sung cho cuộc thảo luận, không phải yêu cầu tạo mới 3 phương án lịch trình từ đầu.
- Chỉ đặt isOffTopic: true khi câu hỏi HOÀN TOÀN nằm ngoài phạm vi du lịch/văn hóa/lịch sử/ẩm thực Việt Nam và không hề liên quan gì đến cuộc hội thoại trước đó (ví dụ: giải toán học, viết code lập trình, khám bệnh y tế, chính trị quốc tế, chứng khoán...).
- Nếu isItineraryRequest là true HOÀN TOÀN destination không phải null → isOffTopic PHẢI là false. Không được có mâu thuẫn.

Trả về duy nhất định dạng JSON:
{
  "isSensitive": boolean,
  "isOffTopic": boolean,
  "isItineraryRequest": boolean,
  "destination": string | null,
  "days": number | null,
  "budget": number | null
}`
          }
        ];

        if (chatHistory && chatHistory.length > 0) {
          chatHistory.slice(-6).forEach(h => {
            semanticMessages.push({
              role: h.role,
              content: h.content
            });
          });
        }

        semanticMessages.push({
          role: 'user',
          content: `Tin nhắn: "${message}"`
        });

        parallelTasks.push(
          createGroqChatCompletion({
            messages: semanticMessages,
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            response_format: { type: 'json_object' }
          }, false).then(comp => {
            const semanticRaw = comp.choices[0]?.message?.content || '{}';
            parsedSemantic = JSON.parse(semanticRaw);
          }).catch(err => {
            console.error("⚠️ Error in parallel Semantic Intent Parser:", err.message);
          })
        );
      }

      // Task B: Smart Cache (Knowledge) Lookup
      if (!placeContext && chatbotDb.readyState === 1 && message.length > 2 && (targetLang === 'vi' || targetLang === 'auto')) {
        const timeSensitiveKeywords = ['thứ mấy', 'ngày nào', 'mấy giờ', 'hôm nay', 'bây giờ', 'thu may', 'ngay nao', 'may gio', 'hom nay', 'bay gio'];
        isTimeSensitive = timeSensitiveKeywords.some(k => lowerMsg.includes(k));
        
        if (!isTimeSensitive) {
          parallelTasks.push(
            Knowledge.findOne({
              $or: [
                { question: lowerMsg },
                { question: message.trim() }
              ]
            }).then(kMatch => {
              knowledgeMatch = kMatch;
            }).catch(err => {
              console.error("⚠️ Error in parallel SmartCache lookup:", err.message);
            })
          );
        }
      }

      // Task C: Wiki Cache pre-fetch for candidate destination
      if (candidateDest && candidateDest.length > 2 && chatbotDb.readyState === 1) {
        const wikiKey = `WIKI_${candidateDest.toLowerCase()}`;
        parallelTasks.push(
          Knowledge.findOne({ question: wikiKey }).then(wikiCache => {
            preFetchedWiki = wikiCache;
          }).catch(err => {
            console.error("⚠️ Error in parallel Wiki pre-fetch:", err.message);
          })
        );
      }

      // Task D: Tour Place Count pre-fetch for candidate destination
      const exactTourKeywords = ['tour', 'gói tour', 'tour trọn gói', 'đặt tour', 'tìm tour'];
      const exactServiceKeywords = ['dịch vụ', 'khách sạn', 'nhà hàng', 'resort', 'homestay', 'chỗ nghỉ', 'quán ăn', 'chuyến đi'];
      const hasTourKeyword = exactTourKeywords.some(k => lowerMsg.includes(k));
      const hasServiceKeyword = exactServiceKeywords.some(k => lowerMsg.includes(k));
      const strongItinKeywords = ['lên lịch', 'lập lịch', 'tạo lịch', 'lịch trình', 'kế hoạch'];
      const hasStrongItinKeyword = strongItinKeywords.some(k => lowerMsg.includes(k));

      if ((hasTourKeyword || hasServiceKeyword) && !hasStrongItinKeyword && candidateDest) {
        const guardQuery = { 
          isDeleted: { $ne: true }, 
          status: 'approved', 
          $or: [{ name: new RegExp(candidateDest, 'i') }, { region: new RegExp(candidateDest, 'i') }] 
        };
        parallelTasks.push(
          Place.countDocuments(guardQuery).then(count => {
            preFetchedTourCount = count;
          }).catch(err => {
            console.error("⚠️ Error in parallel Place count pre-fetch:", err.message);
          })
        );
      }

      if (parallelTasks.length > 0) {
        await Promise.all(parallelTasks);
      }
    } catch (parallelErr) {
      console.error("⚠️ Lỗi thực thi song song các tác vụ phân tích & pre-fetch:", parallelErr.message);
    }

    // Merge intent classifier results
    if (parsedSemantic) {
      semanticIntent = { ...semanticIntent, ...parsedSemantic };

      const cleanMsg = message.toLowerCase().trim().replace(/[?.,!]$/, "");

      // Ép isOffTopic về false nếu có từ khóa lập lịch/lịch trình rõ ràng hoặc có địa điểm du lịch
      const hasItineraryKeyword = itineraryKeywords.some(k => cleanMsg.includes(k)) || 
                                  (cleanMsg.includes('lịch') && cleanMsg.includes('trình')) ||
                                  (cleanMsg.includes('kế') && cleanMsg.includes('hoạch'));
      if (hasItineraryKeyword || candidateDest) {
        semanticIntent.isOffTopic = false;
        if (hasItineraryKeyword) {
          semanticIntent.isItineraryRequest = true;
        }
      }

      // Ép isOffTopic về false nếu tin nhắn chứa từ khóa địa bàn biển đảo quan trọng hoặc các phản hồi ngắn khi có lịch sử
      const territorialKeywords = ['hoàng sa', 'trường sa', 'hoang sa', 'truong sa', 'phú quốc', 'côn đảo'];
      
      if (territorialKeywords.some(k => cleanMsg.includes(k))) {
        semanticIntent.isOffTopic = false;
        if (!semanticIntent.destination) {
          if (cleanMsg.includes('hoàng sa') || cleanMsg.includes('hoang sa')) {
            semanticIntent.destination = 'Hoàng Sa';
          } else if (cleanMsg.includes('trường sa') || cleanMsg.includes('truong sa')) {
            semanticIntent.destination = 'Trường Sa';
          }
        }
      }

      const shortConfirmations = ['có', 'co', 'ok', 'yes', 'ừ', 'u', 'được', 'duoc', 'muốn', 'muon', 'đồng ý', 'dong y', 'đúng', 'dung', 'không', 'khong', 'không cần', 'khong can', 'chưa', 'chua', 'đâu em', 'dau em', 'đâu', 'dau', 'ở đâu', 'o dau', 'chỗ nào', 'cho nao', 'nào', 'nao', 'thế nào', 'the nao', 'sao', 'sao em', 'sao ad', 'đâu vậy', 'dau vay', 'ở đâu vậy', 'o dau vay', 'ở đâu thế', 'o dau the'];
      if (chatHistory && chatHistory.length > 0 && (shortConfirmations.includes(cleanMsg) || cleanMsg.length < 15)) {
        semanticIntent.isOffTopic = false;
      }

      console.log(`🧠 [Semantic Intent Parser] Analyzed:`, semanticIntent);

      try {
        fs.appendFileSync(path.join(__dirname, '../../debug_classification.log'), JSON.stringify({
          timestamp: new Date().toISOString(),
          message: message,
          chatHistory: chatHistory,
          semanticIntent: semanticIntent
        }, null, 2) + "\n\n");
      } catch (logErr) {
        console.error("Log error:", logErr);
      }
    }

    // --- RETURN SMART CACHE ANSWER IF AVAILABLE ---
    if (knowledgeMatch) {
      console.log("➡️ [SmartCache] Khớp kiến thức:", knowledgeMatch.question);
      
      if (chatbotDb.readyState === 1 && !clientDisconnected) {
        if (!currentSessionId) currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const title = message.split(' ').slice(0, 5).join(' ');
        Promise.all([
          new Conversation({ userId: sessionKey, sessionId: currentSessionId, title: title, role: 'user', text: message }).save(),
          new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'model', text: knowledgeMatch.answer }).save()
        ]).catch(err => console.error("Lỗi lưu DB SmartCache:", err.message));
      }

      const meta = await generateResponseMetadata(message, knowledgeMatch.answer, locationContext, false);
      return res.json({
        success: true,
        answer: knowledgeMatch.answer,
        sessionId: currentSessionId,
        proposal: meta.proposal,
        discoveryPlaces: meta.discoveryPlaces,
        suggestedTours: meta.suggestedTours,
        source: 'smart-cache-knowledge'
      });
    }

    let searchResult = null;
    let destToSearch = semanticIntent.destination;
    try {
      let specificLandmark = null;
      const contextKeywords = ['đây','bây giờ','tối nay','hiện tại','này','mình','tôi','em'];

      // B. WIKIPEDIA WEB SEARCH & SMART CACHE (Tải TOÀN BỘ thông tin thật và lưu DB)
      
      // Cứu cánh cho câu hỏi nối tiếp (VD: "bây giờ cơ mà"): Lục lại lịch sử chat để tìm địa danh đang nói đến
      if (!destToSearch && chatHistory.length > 0) {
        destToSearch = candidateDest;
      }

      if (destToSearch && destToSearch.length > 2 && !searchResult) {
        try {
          let wikiRecord = null;
          if (candidateDest && destToSearch.toLowerCase() === candidateDest.toLowerCase()) {
            wikiRecord = preFetchedWiki;
          } else {
            const wikiKey = `WIKI_${destToSearch.toLowerCase()}`;
            wikiRecord = await Knowledge.findOne({ question: wikiKey });
          }

          if (wikiRecord) {
            searchResult = wikiRecord.answer;
            if (searchResult && searchResult.length > 3000) {
              searchResult = searchResult.substring(0, 3000) + "...";
            }
            console.log(`🌐 [Wiki Cache] Đã lấy kho dữ liệu khổng lồ từ Database cho: ${destToSearch}`);
          } else {
            const wikiKey = `WIKI_${destToSearch.toLowerCase()}`;
            const https = require('https');
            const wikiUrl = `https://vi.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&explaintext&redirects=1&titles=${encodeURIComponent(destToSearch)}`;
            const options = {
              timeout: 5000,
              headers: {
                'User-Agent': 'WanderVietBot/1.0 (wanderviet@example.com)'
              }
            };
            
            const fetchedResult = await new Promise((resolve) => {
              https.get(wikiUrl, options, (resp) => {
                let data = '';
                resp.on('data', (chunk) => { data += chunk; });
                resp.on('end', () => {
                  try {
                    const wikiData = JSON.parse(data);
                    const pages = wikiData.query.pages;
                    const pageId = Object.keys(pages)[0];
                    if (pageId !== '-1' && pages[pageId].extract && pages[pageId].extract.length > 100) {
                      const fullExtract = pages[pageId].extract;
                      let snippet = fullExtract;
                      let extract = fullExtract;
                      // Groq models have large context windows. We can easily pass 12000 chars (approx 3000 tokens)
                      if (snippet.length > 12000) {
                        const query = destToSearch.toLowerCase();
                        const lowerExtract = fullExtract.toLowerCase();
                        const idx = lowerExtract.indexOf(query);
                        if (idx !== -1) {
                          const start = Math.max(0, idx - 1000);
                          const end = Math.min(extract.length, idx + 11000);
                          extract = extract.substring(start, end);
                        } else {
                          extract = extract.substring(0, 12000);
                        }
                        snippet = extract;
                      }
                      resolve({ snippet, full: fullExtract });
                    } else {
                      resolve(null);
                    }
                  } catch (e) { resolve(null); }
                });
              }).on("error", () => resolve(null)).on("timeout", () => resolve(null));
            });
            
            if (fetchedResult) {
              console.log(`🌐 [Wiki Fact-Check] Đã tải thông tin cho: ${destToSearch}`);
              Knowledge.create({
                question: wikiKey,
                answer: fetchedResult.full,
                userName: 'AI System',
                source: 'ai_learned'
              }).catch(err => console.error("Lỗi lưu wiki vào DB:", err));
              searchResult = fetchedResult.snippet;
            }
          }
        } catch (e) {
          console.error("Wiki fetch error:", e.message);
        }
      }

      // If user explicitly asks for full detail, return the stored full article
      if ((lowerMsg.includes('chi tiết') || lowerMsg.includes('toàn bộ')) && destToSearch) {
          const wikiKey = `WIKI_${destToSearch.toLowerCase()}`;
          const fullDoc = await Knowledge.findOne({ question: wikiKey });
          if (fullDoc) {
              return res.json({
                  success: true,
                  answer: fullDoc.answer,
                  source: 'wiki_full_detail'
              });
          }
      }

      // C. Tìm trong lịch sử hội thoại toàn cầu (Global Conversation Cache) - dùng contextKeywords đã khai báo ở dưới
      const historyContextKeywords = ['đó', 'đấy', 'kia', 'này', 'nơi đó', 'chỗ đó', 'ở đó', 'ở đấy', 'vừa rồi', 'trước đó', 'do', 'day', 'kia', 'nay', 'noi do', 'cho do', 'o do', 'o day', 'vua roi', 'truoc do'];
      const isContextSensitive = historyContextKeywords.some(k => lowerMsg.includes(k));

      // Bỏ qua SmartCache nếu là yêu cầu lập lịch (cần xử lý đặc biệt)
      const itinKwsEarly = [
        'lập lịch', 'tạo lịch', 'lên kế hoạch', 'lịch trình', 'itinerary', 'hành trình cho', 'đặt lịch', 'thiết kế chuyến', 'tạo chuyến',
        'lap lich', 'tao lich', 'len ke hoach', 'lich trinh', 'hanh trinh cho', 'dat lich', 'thiet ke chuyen', 'tao chuyen'
      ];
      const isItinEarly = itinKwsEarly.some(k => lowerMsg.includes(k));

      if (!searchResult && !isContextSensitive && !isItinEarly && !isTimeSensitive && lowerMsg.length > 10 && (!images || images.length === 0)) {
        // Tìm câu trả lời gần nhất cho câu hỏi y hệt này, nhưng CHỈ lấy nếu câu trả lời đó được đánh giá TỐT (up) hoặc là từ AI uy tín
        const prevQuestion = await Conversation.findOne({
          role: 'user',
          text: { $regex: new RegExp(`^${message.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        }).sort({ timestamp: -1 });

        if (prevQuestion) {
          const prevAnswer = await Conversation.findOne({
            role: 'model',
            sessionId: prevQuestion.sessionId, // Phải cùng phiên để đảm bảo ngữ cảnh
            timestamp: { $gt: prevQuestion.timestamp },
            $or: [
              { feedback: 'up' },
              { isVerified: true } // Các câu trả lời được admin xác nhận
            ]
          }).sort({ timestamp: 1 });

          if (prevAnswer && prevAnswer.text) {
            console.log("➡️ [SmartCache] Khớp lịch sử cộng đồng:", message);
            
            if (chatbotDb.readyState === 1) {
              if (!currentSessionId) currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
              const title = message.split(' ').slice(0, 5).join(' ');
              await new Conversation({ userId: sessionKey, sessionId: currentSessionId, title: title, role: 'user', text: message }).save();
              await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'model', text: prevAnswer.text }).save();
            }

            const meta = await generateResponseMetadata(message, prevAnswer.text, locationContext, false);
            return res.json({
              success: true,
              answer: prevAnswer.text,
              sessionId: currentSessionId,
              proposal: meta.proposal,
              discoveryPlaces: meta.discoveryPlaces,
              suggestedTours: meta.suggestedTours,
              source: 'smart-cache-history'
            });
          }
        }
      }
    } catch (cacheErr) {
      console.error("⚠️ SmartCache Error Stack:", cacheErr.stack);
    }
    // --- END SMART CACHE ---

    // --- START SYSTEM PROMPT CONSTRUCTION ---
    let systemPrompt = "";
    const userRole = role || (req.user ? req.user.role : 'user');

    if (placeContext) {
      // CHẾ ĐỘ CHUYÊN GIA DỊCH VỤ CỐ ĐỊNH (FIXED CONTEXT)
      systemPrompt = `BẠN LÀ NHÂN VIÊN CHUYÊN TRÁCH CỦA DỊCH VỤ: "${placeContext.name}".
DỮ LIỆU CỐ ĐỊNH (DUY NHẤT):
- Tên: ${placeContext.name}
- Loại: ${placeContext.kind || placeContext.businessCategory}
- Mô tả: ${placeContext.description || placeContext.text}
- Đặc điểm: ${Array.isArray(placeContext.highlights) ? placeContext.highlights.join(', ') : 'Chưa có'}
- Tiện ích: ${Array.isArray(placeContext.amenities) ? placeContext.amenities.join(', ') : 'Chưa có'}
- Giá: ${placeContext.price || placeContext.priceFrom || 'Liên hệ'} VNĐ
- Giờ mở cửa: ${placeContext.openTime} - ${placeContext.closeTime}
- FAQ: ${Array.isArray(placeContext.faqs) ? placeContext.faqs.map(f => `Q: ${f.question} -> A: ${f.answer}`).join(' || ') : 'Chưa có'}

QUY TẮC TỐI THƯỢNG (PHẢI TUÂN THỦ):
1. KHÔNG SỬ DỤNG KIẾN THỨC BÊN NGOÀI. Chỉ trả lời dựa trên DỮ LIỆU CỐ ĐỊNH ở trên.
2. Nếu khách hỏi "có món gì" hoặc "có gì hay", hãy trích xuất thông tin từ 'Mô tả' hoặc 'Đặc điểm'. 
3. TUYỆT ĐỐI KHÔNG bịa ra các món ăn (như Bánh mì, Phở...) nếu chúng không có trong DỮ LIỆU CỐ ĐỊNH.
4. Nếu không có thông tin trong dữ liệu, hãy nói: "Xin lỗi, hiện tại mình chỉ có thông tin về [Tên dịch vụ] như sau: [Tóm tắt dữ liệu]. Bạn vui lòng liên hệ trực tiếp để biết thêm chi tiết nhé!".
5. Cấm giới thiệu các địa điểm khác. Bạn chỉ trung thành với "${placeContext.name}".
`;
    } else if (scope === 'admin_portal') {
      systemPrompt = `BẠN LÀ: TRỰC QUAN QUẢN TRỊ - SENTINEL AI của WanderViet AI. Phong cách: Chính xác.`;
    } else if (scope === 'business_portal') {
      systemPrompt = `BẠN LÀ: CỐ VẤN KINH DOANH WanderViet AI. Hỗ trợ doanh nghiệp tối ưu vận hành.`;
    } else {
      systemPrompt = `BẠN LÀ: WanderViet AI - Trợ lý du lịch thông thái, am hiểu sâu sắc và tinh tế bậc nhất.

=== 1. WANDERVIET AI - BỘ NÃO NGỮ CẢNH (CONTEXT INTELLIGENCE SYSTEM) ===
Nhiệm vụ của bạn không chỉ là trả lời câu hỏi hiện tại mà còn phải duy trì sự liên tục của cuộc hội thoại, ghi nhớ ngữ cảnh, suy luận hợp lý và hỗ trợ người dùng như một người đồng hành du lịch thực sự.

* NGUYÊN TẮC CỐT LÕI:
  - Luôn ưu tiên NGỮ CẢNH hơn từ khóa đơn lẻ. Không phân tích từng câu hỏi một cách tách biệt.
  - Mỗi câu hỏi mới phải được hiểu trong mối liên hệ với: Chủ đề đang thảo luận, Điểm đến gần nhất, Kế hoạch du lịch hiện tại, Sở thích đã đề cập, và Thông tin người dùng đã cung cấp trước đó.
  - Mục tiêu là duy trì một cuộc hội thoại liên tục và tự nhiên.

* BỘ NHỚ HỘI THOẠI:
  - Trong suốt cuộc trò chuyện, hãy chủ động ghi nhớ các thông tin quan trọng: Điểm đến, Địa phương, Thành phố, Tỉnh thành, Số ngày du lịch, Ngân sách, Nhóm khách, Sở thích, Loại hình du lịch, Khách sạn, Nhà hàng, Địa điểm tham quan, Chủ đề đang trao đổi.
  - Khi người dùng đã cung cấp thông tin, không yêu cầu họ lặp lại nếu không thực sự cần thiết.

* DUY TRÌ CHỦ ĐỀ & TOPIC LOCK:
  - Nếu người dùng đang nói về một điểm đến:
    Ví dụ: "Tôi muốn đi Đà Nẵng 3 ngày."
    Mọi câu hỏi tiếp theo như: "Nên ở đâu?", "Ăn gì?", "Chi phí thế nào?", "Có đáng đi không?", "Ngày thứ hai nên đi đâu?" đều phải được hiểu là đang nói về Đà Nẵng. Không được tự ý đổi sang địa điểm khác. Không được quên địa điểm hiện tại chỉ vì xuất hiện một địa danh khác trong nội dung trả lời trước đó.
  - Khi đã xác định được chủ đề chính của cuộc hội thoại: Giữ nguyên chủ đề đó. Chỉ chuyển chủ đề khi người dùng chủ động thay đổi (Ví dụ: "Tôi đang tìm hiểu Đà Lạt." -> "Khách sạn nào đẹp?" -> hiểu là khách sạn ở Đà Lạt; "Còn Sapa thì sao?" -> đây là tín hiệu chuyển chủ đề sang Sapa, lúc này mới bắt đầu phân tích Sapa).

* XỬ LÝ CÂU HỎI NGẮN:
  - Các câu hỏi ngắn phải được suy luận dựa trên ngữ cảnh gần nhất (Ví dụ: "Nên ở đâu?", "Ăn gì?", "Có đáng không?", "Bao nhiêu tiền?", "Đi mùa nào đẹp?", "Có phù hợp gia đình không?"). Không được coi đây là câu hỏi độc lập. Luôn tìm đối tượng đang được thảo luận gần nhất.

* ƯU TIÊN SUY LUẬN NGỮ CẢNH & KHÔNG HÀNH XỬ MÁY MÓC:
  - Trước khi trả lời, luôn tự kiểm tra:
    1. Người dùng đang nói về địa điểm nào?
    2. Chủ đề hiện tại là gì?
    3. Có thông tin nào đã được cung cấp trước đó không?
    4. Câu hỏi hiện tại đang tham chiếu tới điều gì?
    5. Có cần hỏi lại hay có thể suy luận hợp lý?
  - Nếu có thể suy luận an toàn từ ngữ cảnh: Trả lời trực tiếp.
  - Nếu có từ hai cách hiểu trở lên: Hỏi lại ngắn gọn để xác nhận.
  - Tuyệt đối không được trả lời theo kiểu máy móc: "Bạn muốn đi đâu?", "Bạn đang nói về địa điểm nào?", "Bạn có thể cung cấp thêm thông tin không?" nếu thông tin đó đã xuất hiện trong cuộc trò chuyện. Ưu tiên sử dụng trí nhớ hội thoại.

* KHÔNG PHÁ VỠ LOGIC HỆ THỐNG:
  - Không được bịa đặt dữ liệu. Không được tạo ra địa điểm không tồn tại. Không được thay đổi thông tin đã xác nhận.
  - Không được suy luận vượt quá dữ kiện đã có. Được phép suy luận hợp lý từ ngữ cảnh. Không được suy diễn vô căn cứ.

* PHONG CÁCH PHẢN HỒI & KIỂM TRA TRƯỚC KHI TRẢ LỜI:
  - Phong cách: Tự nhiên, thân thiện, thông minh, chủ động, có khả năng ghi nhớ và liên kết thông tin. Trả lời như một chuyên gia du lịch thực thụ. Mỗi phản hồi phải thể hiện rằng bạn hiểu cuộc trò chuyện đang diễn ra chứ không chỉ hiểu riêng câu hỏi hiện tại.
  - Trước mỗi phản hồi, hãy tự đánh giá: Tôi có đang nhớ đúng chủ đề hiện tại không? Tôi có đang nhớ đúng điểm đến hiện tại không? Tôi có đang tận dụng ngữ cảnh trước đó không? Người dùng có đang tiếp tục câu chuyện hay đang mở chủ đề mới? Câu trả lời của tôi có mang tính liên tục không? Chỉ sau khi hoàn thành các bước trên mới đưa ra phản hồi cuối cùng.

=== 2. PHONG CÁCH & DIỆN MẠO CHUYÊN GIA ===
- Phong cách: Thân thiện, hiếu khách, nhiệt tình nhưng cực kỳ chuyên nghiệp và đáng tin cậy. Thể hiện đẳng cấp của một cố vấn du lịch thực thụ.
- Cách xưng hô: Xưng "mình" hoặc "WanderViet AI", gọi khách là "bạn" (hoặc xưng hô linh hoạt, lịch sự theo ngữ cảnh hội thoại). Sử dụng tự nhiên các từ đệm như "nè", "nha", "nhé" để tạo cảm giác gần gũi.
- Trình bày: BẮT BUỘC sử dụng định dạng Markdown sang trọng (in đậm, gạch đầu dòng, danh sách, emoji sinh động, bảng biểu khi cần thiết). Không viết những khối văn bản dài dặc gây mỏi mắt. Chia đoạn rõ ràng, rành mạch.

=== 3. RANH GIỚI PHẠM VI NHIỆM VỤ (STRICT BOUNDARIES) ===
Bạn phải có ranh giới nhiệm vụ cực kỳ rõ ràng và nghiêm ngặt:
* NẰM TRONG PHẠM VI HỖ TRỢ (IN-SCOPE):
  - Địa điểm du lịch, danh lam thắng cảnh, điểm vui chơi giải trí trên khắp Việt Nam.
  - LỊCH SỬ & ĐỊA LÝ VIỆT NAM LIÊN QUAN ĐẾN ĐỊA DANH: Đây là cốt lõi của du lịch văn hóa. Khách hỏi về nguồn gốc lịch sử (Sự tích Hồ Gươm, Ải Chi Lăng, triều đại nhà Lê tại Lam Kinh...), địa hình, khí hậu, vị trí của bất kỳ địa phương nào tại Việt Nam đều NẰM TRONG phạm vi bạn phải trả lời thật sâu sắc, cuốn hút và chính xác.
  - Ẩm thực, đặc sản địa phương, nhà hàng, phong tục tập quán, lễ hội truyền thống Việt Nam.
  - Lập kế hoạch chuyến đi, thiết kế lịch trình cá nhân hóa, dự trù ngân sách, phương tiện di chuyển.
  - Hướng dẫn đặt tour, phòng khách sạn, thuê xe... có trên hệ thống WanderViet.
* NẰM NGOÀI PHẠM VI HỖ TRỢ (OUT-OF-SCOPE):
  - Các câu hỏi hoàn toàn không liên quan đến du lịch, văn hóa, ẩm thực, lịch sử hay địa lý Việt Nam.
  - Ví dụ: "tôi muốn đi học", "con chó có màu gì", giải toán, viết code, tư vấn tài chính, y khoa, chính trị nhạy cảm...
  - NGUYÊN TẮC XỬ LÝ CÂU HỎI NGẮN & ĐẠI TỪ CHỈ ĐỊNH: Các câu hỏi ngắn như "đâu em", "ở đâu", "chỗ nào", "sao", "thế nào", "sao thế", "ở đâu vậy" là các câu hỏi nối tiếp của cuộc thảo luận phía trên. Bạn TUYỆT ĐỐI không được coi đây là câu hỏi ngoài lề (Out-of-scope) và không được sử dụng mẫu câu từ chối. Bạn phải kết nối trực tiếp với lịch sử trò chuyện gần nhất để suy luận đối tượng được nhắc đến (ví dụ: nếu vừa gợi ý phương án lịch trình, hãy giải thích vị trí hoặc các phương án đang hiển thị ở thẻ bên dưới).
  - NGUYÊN TẮC TỪ CHỐI KHÉO: Khi khách hỏi các câu độc lập hoàn toàn ngoài lề du lịch Việt Nam, hãy từ chối khéo léo.
  * Mẫu câu từ chối chuẩn: "Dù rất muốn chia sẻ cùng bạn nhưng mình là WanderViet AI - Trợ lý chuyên trách về du lịch và khám phá Việt Nam mất rồi nè! Căn bếp nhỏ của mình hiện tại chỉ có sẵn 'bí kíp' về các cung đường đẹp, món ăn ngon, lịch sử địa danh và lịch trình du lịch siêu chill thôi. Bạn có muốn mình gợi ý một điểm đến thú vị hay lên kế hoạch cho chuyến đi sắp tới của bạn không?"

=== 4. HIỂU NGỮ CẢNH SÂU & CHỐNG SPAM TOUR BỪA BÃI (DEEP CONTEXT & ANTI-SPAM) ===
- Xử lý lỗi gõ nhanh/viết tắt/không dấu của khách: Khách hàng có thể nhắn tin rất nhanh dẫn đến sai chính tả hoặc viết tắt (VD: "lịch trìn hn", "tuyen qang 2n", "ksan hnoi", "đi chơi gi"). Hãy dùng năng lực suy luận ngữ cảnh để hiểu đúng ý họ muốn nói (ví dụ: "tuyen qang 2n" -> "Tuyên Quang 2 ngày") thay vì hỏi lại hoặc trả lời lạc đề.
- NGUYÊN TẮC CHỐNG SPAM TOUR/LỊCH TRÌNH:
  + Tán gẫu & Hỏi đáp kiến thức thuần túy: Khi khách chỉ chào hỏi, hỏi thăm sức khỏe, hoặc hỏi kiến thức lịch sử/địa lý thuần túy (VD: "Cầu Long Biên được xây năm nào?", "Hà Giang giáp những tỉnh nào?"), bạn CHỈ TRẢ LỜI CHÍNH XÁC kiến thức đó. Tuyệt đối KHÔNG tự ý chèn link giới thiệu tour du lịch hay lịch trình chi tiết vào lúc này vì sẽ gây cảm giác chèo kéo phiền phức.
  + Chỉ gợi ý khi có nhu cầu thực tế: Chỉ bắt đầu tư vấn dịch vụ, đề xuất tour hoặc thiết kế lịch trình khi khách chủ động yêu cầu (VD: "Lập cho mình lịch trình...", "Ở đây có tour nào không bạn?", "Gợi ý cho mình khách sạn đẹp ở Đà Lạt") hoặc khi câu chuyện tự nhiên dẫn dắt đến việc khách đang chuẩn bị đi du lịch và cần giải pháp cụ thể.

=== 5. QUY TRÌNH THIẾT KẾ LỊCH TRÌNH LINH HOẠT & CÁ NHÂN HÓA ===
Khi khách yêu cầu lập lịch trình, bạn phải thiết kế một cách linh hoạt, cá nhân hóa tối đa theo các thông số được cung cấp:
1. Địa điểm (Destination): Phải chính xác tuyệt đối về mặt địa lý thực tế ở Việt Nam. Tuyệt đối không râu ông nọ cắm cằm bà kia (CẤM lấy món ăn/địa danh Hà Nội gán vào Đà Nẵng). BẮT BUỘC ưu tiên sử dụng các địa danh, món ăn, dịch vụ có sẵn trong "DỮ LIỆU ĐỊA PHƯƠNG KHẢO SÁT" ở bên dưới để tránh bịa đặt hoặc đưa địa danh của tỉnh khác vào.
2. Thời gian & Ngày tháng: Chia lịch trình theo từng ngày rõ ràng (Ngày 1, Ngày 2...), phân bổ hoạt động hợp lý theo buổi Sáng, Trưa, Chiều, Tối. Nhịp độ di chuyển phải phù hợp (thong thả hay năng động).
3. Ngân sách (Budget): Dự trù số tiền hợp lý cho chuyến đi theo phân khúc ngân sách khách yêu cầu (Tiết kiệm, Tầm trung, Sang trọng). Đưa ra các gợi ý chi phí thực tế (tiền ăn uống ước lượng, vé tham quan, tiền phòng).
4. Bạn đồng hành & Phong cách: Hỏi han hoặc nhận diện bạn đồng hành để tinh chỉnh hoạt động:
   - Đi với gia đình có người già/trẻ nhỏ -> Lịch trình thong thả, an toàn, ít di chuyển xa.
   - Đi với nhóm bạn trẻ -> Năng động, trải nghiệm phượt, check-in các điểm hot, ẩm thực đường phố.
   - Đi cặp đôi -> Lãng mạn, chill, cafe view đẹp, nghỉ dưỡng sang trọng.
5. TRÌNH BÀY LỊCH TRÌNH SIÊU ĐẸP & TRỰC QUAN (ĐÁP ỨNG TIÊU CHUẨN THẨM MỸ CAO):
   - Sử dụng định dạng Markdown sang trọng và rõ ràng: Tiêu đề lớn ('#'), Tiêu đề phụ ('##', '###'), in đậm các từ khóa quan trọng ('**'), phân tách các ngày rõ ràng.
   - Sử dụng Emojis sinh động để phân tách các buổi trong ngày (Ví dụ: 🌅 Sáng:, ☀️ Trưa:, 🌆 Chiều:, 🌃 Tối:), các hoạt động (Ví dụ: 🍽️ Ăn uống, ☕ Cà phê, 📸 Check-in, 🚗 Di chuyển, 🛍️ Mua sắm, 🏨 Khách sạn).
   - Mỗi ngày nên có một "Tiêu điểm nổi bật" (Highlight) và "Lời khuyên từ chuyên gia" (Expert Tip/Lưu ý) để giúp hành trình sinh động hơn.
   - Cung cấp một bảng ước tính chi phí tổng quan và tóm tắt lời khuyên ở cuối lịch trình.
   - Giọng điệu hào hứng, truyền cảm hứng du lịch.

=== 6. QUY TẮC PHỐI HỢP VỚI HỆ THỐNG WANDERVIET ===
Hãy quan sát kỹ tín hiệu từ hệ thống được truyền vào qua ngữ cảnh (system context) ở cuối prompt để phản hồi đồng nhất:
- Nếu hệ thống thông báo "Đã tìm thấy [X] bài đăng doanh nghiệp (tour/dịch vụ)...": Bạn phải trả lời một cách tự nhiên rằng hệ thống WanderViet đã tìm thấy các dịch vụ/tour cực kỳ chất lượng tại đây. Hãy nhiệt tình hướng dẫn khách hàng xem và bấm chọn các thẻ gợi ý (Tours/Services) trực quan đang hiển thị ngay phía dưới khung chat để biết thêm thông tin chi tiết và đặt dịch vụ.
- Nếu hệ thống thông báo "HIỆN TẠI CHƯA CÓ TOUR HOẶC DỊCH VỤ...": Hãy trả lời trung thực với khách: "Hiện tại hệ thống WanderViet chưa có sẵn tour hay dịch vụ đối tác đăng ký tại [Địa danh]." Tuy nhiên, hãy thể hiện sự chu đáo bằng cách chủ động đề nghị tự mình lên một lịch trình (Itinerary) tự túc chi tiết, cá nhân hóa thay thế ngay trong khung chat cho khách.`;
    }

    // --- REAL-TIME CONTEXT ---
    const now = new Date();
    const timeContext = `\n[Bối cảnh]: ${now.getHours()}:${now.getMinutes()} ngày ${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}.`;
    systemPrompt += timeContext;

    // --- LANGUAGE RULE (Simplified to avoid confusion) ---
    const languageNames = { 'vi': 'Tiếng Việt', 'en': 'English', 'jp': 'Japanese', 'kr': 'Korean', 'fr': 'French' };
    let langRule = "Trả lời bằng chính ngôn ngữ khách đang hỏi.";
    if (req.body.lang && req.body.lang !== 'auto') {
      langRule = `BẮT BUỘC TRẢ LỜI BẰNG ${languageNames[req.body.lang] || 'Tiếng Việt'}.`;
    }
    systemPrompt += `\n${langRule}`;

    // --- AI CONTEXT GUARD: ÉP AI CHỈ TRẢ LỜI ĐÚNG PHẠM VI ---
    systemPrompt += `
QUY TẮC CỐT LÕI:
1. Nếu hỏi nội dung KHÔNG liên quan du lịch/hệ thống, hãy từ chối khéo léo.
${placeContext ? `2. BẠN ĐANG TRONG CHẾ ĐỘ 'CHUYÊN GIA DỊCH VỤ CỤ THỂ'. KHÔNG ĐƯỢC tư vấn sang các địa điểm hoặc dịch vụ khác ngoài "${placeContext.name}". Nếu khách hỏi nơi khác, hãy nhắc khách rằng bạn là chuyên gia riêng của "${placeContext.name}".` : '2. Tư vấn du lịch rộng khắp dựa trên dữ liệu hệ thống.'}
3. CẤM BỊA ĐẶT THÔNG TIN ĐỊA LÝ: Tuyệt đối không tự bịa ra vị trí địa lý sai lệch. Khi đọc THÔNG TIN TRA CỨU MỚI (nếu có), PHẢI PHÂN BIỆT RÕ RÀNG địa danh đang hỏi với các địa danh giáp ranh hoặc bị sáp nhập trong lịch sử. Nếu không biết chính xác, hãy thú nhận.
4. Trình bày bằng Markdown rõ ràng, có tiêu đề phụ và chia đoạn dễ đọc. Hãy đưa ra câu trả lời chi tiết và đúng trọng tâm nhất có thể.
`;

    // --- AI SELF-LEARNING MEMORY ---
    let userMemoryContext = "";
    if (req.user && req.user.id) {
      try {
        const fullUser = await User.findById(req.user.id).select('preferenceProfile');
        if (fullUser && fullUser.preferenceProfile && fullUser.preferenceProfile.aiInsights && fullUser.preferenceProfile.aiInsights.length > 0) {
          userMemoryContext = "\n- TRÍ NHỚ VỀ KHÁCH: " + fullUser.preferenceProfile.aiInsights.join("; ");
        }
      } catch (err) { }
    }

    systemPrompt += userMemoryContext;
    if (searchResult) systemPrompt += `\n- THÔNG TIN TRA CỨU MỚI: ${searchResult}`;
    
    let localPlacesSystemCtx = "";
    if (candidateDest) {
      try {
        localPlacesSystemCtx = await getLocalPlacesContext(candidateDest);
      } catch (err) {}
    }
    if (localPlacesSystemCtx) {
      systemPrompt += `\n- DỮ LIỆU ĐỊA DANH & ĐỊA ĐIỂM THỰC TẾ TẠI ĐỊA PHƯƠNG (BẮT BUỘC SỬ DỤNG KHI TƯ VẤN/LÊN LỊCH TRÌNH): \n${localPlacesSystemCtx}`;
    }
    
    systemPrompt += `\n- NGỮ CẢNH VỊ TRÍ: ${locationContext}`;
    systemPrompt += `\n- VAI TRÒ NGƯỜI DÙNG: ${userRole} || TRANG: ${scope}`;
    
    if (images && images.length > 0) {
      systemPrompt += `\n\n=== CHỈ THỊ PHÂN TÍCH HÌNH ẢNH (VISION INSTRUCTION) ===
- Khách hàng đã gửi kèm hình ảnh. Hãy nhận diện nội dung hình ảnh đó: cảnh quan, di tích, ẩm thực, hoạt động du lịch, hoặc bất kỳ vật thể/văn bản nào xuất hiện.
- Nhận biết hình ảnh đó nói đến địa điểm/sự kiện nào ở Việt Nam. Nếu hình ảnh giống hoặc gợi nhớ đến một địa điểm du lịch nổi tiếng nào của Việt Nam, hãy thảo luận và đưa ra so sánh hoặc gợi ý (Ví dụ: "Hình ảnh này trông giống như Vịnh Hạ Long...", "Bức ảnh này gợi nhớ đến phố cổ Hội An...").
- Trả lời một cách tự nhiên, liên kết hình ảnh với sở thích hoặc nhu cầu du lịch của khách hàng.`;
    }

    systemPrompt += `\n\nCHỈ THỊ CUỐI CÙNG: Trả lời bằng ngôn ngữ của khách. Thân thiện, ngắn gọn, cực kỳ am hiểu về dữ liệu trên.`;

    // --- PHÁT HIỆN YÊU CẦU LẬP LỊCH TRÌNH (ITINERARY GENERATION) ---
    // Phát hiện thêm các câu đổi ý chung chung như "k thích đại điểm này đổi đi"
    let isModification = lowerMsg.includes('đổi') || lowerMsg.includes('doi') || lowerMsg.includes('k thích') || lowerMsg.includes('không thích') || lowerMsg.includes('khong thich');
    let isItineraryRequest = itineraryKeywords.some(k => lowerMsg.includes(k)) || 
                             (lowerMsg.includes('lịch') && lowerMsg.includes('trình')) ||
                             (lowerMsg.includes('kế') && lowerMsg.includes('hoạch'));

    if (isModification && (lowerMsg.includes('điểm') || lowerMsg.includes('diem') || lowerMsg.includes('chỗ') || lowerMsg.includes('cho') || lowerMsg.includes('này') || lowerMsg.includes('nay'))) {
      isItineraryRequest = true;
    }

    // ═══ SEMANTIC OVERRIDE CÓ ĐIỀU KIỆN (CHỐNG TẠO LỊCH TRÌNH BỪA BÃI) ═══
    if (scope === 'user_portal' && !placeContext) {
      if (semanticIntent.isItineraryRequest) {
        // Semantic Intent AI (LLaMA/Groq) rất dễ đánh dấu nhầm 1 từ "tuyên quang" là yêu cầu xin lịch trình.
        // Chỉ chấp nhận nếu câu hỏi của user có chứa từ khóa hành động cụ thể, HOẶC là câu trả lời nối tiếp cho câu hỏi lập lịch trình.
        const explicitItinKeywords = ['lịch', 'kế hoạch', 'gợi ý', 'plan', 'đi đâu', 'chơi gì', 'muốn đi', 'cho mình đi', 'cho minh di', 'hành trình', 'tạo', 'lên', 'phương án'];
        const hasExplicit = explicitItinKeywords.some(k => lowerMsg.includes(k));
        
        let isConversationalFollowUp = false;
        if (chatHistory && chatHistory.length > 0) {
           const lastMsg = chatHistory[chatHistory.length - 1];
           if (lastMsg.role === 'assistant' && (lastMsg.content.toLowerCase().includes('lập lịch') || lastMsg.content.toLowerCase().includes('đi đâu') || lastMsg.content.toLowerCase().includes('bao lâu'))) {
               isConversationalFollowUp = true;
           }
        }
        
        const hasDetailedParams = semanticIntent.destination && (semanticIntent.days || semanticIntent.budget);

        // NẾU TỪ TRƯỚC ĐÃ TRUE (nhờ keyword) thì GIỮ NGUYÊN.
        isItineraryRequest = isItineraryRequest || hasExplicit || isConversationalFollowUp || hasDetailedParams;
        
        if (!isItineraryRequest) {
            console.log(`🚫 [Itinerary Guard] Semantic Intent rejected (no explicit keyword, not follow-up, and missing detailed params in '${lowerMsg}').`);
        }
      } else {
        // NẾU semanticIntent BÁO FALSE, NHƯNG user gõ đúng keyword (VD: "tạo lịch trình") -> VẪN PHẢI CHO PHÉP (GIỮ NGUYÊN)
        // Nghĩa là không set `isItineraryRequest = false` một cách mù quáng.
      }
    }

    // ═══ PHÂN BIỆT RÕ RÀNG GIỮA TOUR/DỊCH VỤ VÀ LỊCH TRÌNH (AI TẠO) ═══
    const exactTourKeywords = ['tour', 'gói tour', 'tour trọn gói', 'đặt tour', 'tìm tour'];
    const exactServiceKeywords = ['dịch vụ', 'khách sạn', 'nhà hàng', 'resort', 'homestay', 'chỗ nghỉ', 'quán ăn', 'chuyến đi'];
    const hasTourKeyword = exactTourKeywords.some(k => lowerMsg.includes(k));
    const hasServiceKeyword = exactServiceKeywords.some(k => lowerMsg.includes(k));
    
    const strongItinKeywords = ['lên lịch', 'lập lịch', 'tạo lịch', 'lịch trình', 'kế hoạch'];
    const hasStrongItinKeyword = strongItinKeywords.some(k => lowerMsg.includes(k));

    if ((hasTourKeyword || hasServiceKeyword) && !hasStrongItinKeyword) {
      isItineraryRequest = false;
      console.log(`🚌 [Service vs Itinerary Guard] Detected explicit SERVICE/TOUR request. Forcing isItineraryRequest=false.`);
      
      const provincesForTour = ['Hà Nội', 'Hồ Chí Minh', 'Sài Gòn', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Lào Cai', 'Sa Pa', 'Yên Bái', 'Điện Biên', 'Lai Châu', 'Sơn La', 'Hòa Bình', 'Hà Giang', 'Tuyên Quang', 'Cao Bằng', 'Bắc Kạn', 'Thái Nguyên', 'Lạng Sơn', 'Bắc Giang', 'Quảng Ninh', 'Hạ Long', 'Phú Thọ', 'Vĩnh Phúc', 'Bắc Ninh', 'Hải Dương', 'Hưng Yên', 'Thái Bình', 'Hà Nam', 'Nam Định', 'Ninh Bình', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế', 'Huế', 'Quảng Nam', 'Hội An', 'Quảng Ngãi', 'Bình Định', 'Quy Nhơn', 'Phú Yên', 'Khánh Hòa', 'Nha Trang', 'Ninh Thuận', 'Bình Thuận', 'Mũi Né', 'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng', 'Đà Lạt', 'Bình Phước', 'Tây Ninh', 'Bình Dương', 'Đồng Nai', 'Bà Rịa Vũng Tàu', 'Vũng Tàu', 'Long An', 'Tiền Giang', 'Bến Tre', 'Trà Vinh', 'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Kiên Giang', 'Phú Quốc', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau'];
      let searchDestTour = null;
      for (const p of provincesForTour) {
         if (lowerMsg.includes(p.toLowerCase())) { searchDestTour = p; break; }
      }
      
      if (!searchDestTour) {
         let destMatch = lowerMsg.match(/(?:ở|tại|đến|đi|cho|tìm|về)\s+([a-zà-ỹ]+(?:\s[a-zà-ỹ]+){1,3})/i);
         if (destMatch) {
             const captured = destMatch[1].trim();
             const badDests = ['trình', 'kế hoạch', 'đi', 'đến', 'này', 'nhé', 'đó', 'đây', 'chơi', 'giúp', 'cho', 'nha', 'chuyến', 'với', 'nhé', 'điểm', 'diem', 'tour', 'dịch vụ', 'khách sạn', 'đâu', 'đâu không', 'gì'];
             if (!badDests.includes(captured) && captured.length > 2) {
                 searchDestTour = captured;
             }
         }
      }
      
      if (searchDestTour) {
         let guardQuery = { isDeleted: { $ne: true }, status: 'approved', $or: [{name: new RegExp(searchDestTour, 'i')}, {region: new RegExp(searchDestTour, 'i')}] };
         
         const localCount = await Place.countDocuments(guardQuery);
         
         if (localCount > 0) {
            systemPrompt += `\n[HỆ THỐNG]: Đã tìm thấy ${localCount} bài đăng doanh nghiệp (tour/dịch vụ) tại ${searchDestTour} trong hệ thống. BẠN PHẢI TRẢ LỜI RẰNG ĐÃ CÓ VÀ MỜI KHÁCH XEM CÁC GỢI Ý DOANH NGHIỆP Ở BÊN DƯỚI. Không tạo lịch trình trừ khi khách yêu cầu.`;
         } else {
            systemPrompt += `\n[HỆ THỐNG]: HIỆN TẠI CHƯA CÓ TOUR HAY DỊCH VỤ NÀO TẠI ${searchDestTour} DO DOANH NGHIỆP ĐĂNG LÊN. BẠN BẮT BUỘC TRẢ LỜI CHÍNH XÁC CÂU SAU: "Hiện tại hệ thống chưa có tour hay dịch vụ nào tại ${searchDestTour}. Bạn có muốn mình tự động lên một Lịch Trình (Itinerary) chi tiết thay thế không?"`;
         }
      }
    }

    // ĐỘC QUYỀN ĐỊA DANH KHÔNG HỖ TRỢ: Nếu khách hỏi địa danh cụ thể nhưng hệ thống không có, bắt buộc tắt chế độ lập lịch để hiển thị duy nhất Google Fallback card.
    const landmarkToProvinceEarly = {
      'văn miếu': 'Hà Nội', 'quốc tử giám': 'Hà Nội', 'hoàn kiếm': 'Hà Nội', 'hồ gươm': 'Hà Nội',
      'ba đình': 'Hà Nội', 'chùa một cột': 'Hà Nội', 'lăng bác': 'Hà Nội', 'tây hồ': 'Hà Nội',
      'đông anh': 'Hà Nội', 'bát tràng': 'Hà Nội', 'thăng long': 'Hà Nội',
      'sơn trà': 'Đà Nẵng', 'ngũ hành sơn': 'Đà Nẵng', 'bà nà': 'Đà Nẵng',
      'phố cổ': 'Hội An', 'chùa cầu': 'Hội An',
      'tháp bà': 'Nha Trang', 'vinpearl': 'Nha Trang',
      'dinh độc lập': 'Hồ Chí Minh', 'bến thành': 'Hồ Chí Minh',
      'bãi sao': 'Phú Quốc', 'cáp treo hòn thơm': 'Phú Quốc',
      'tràng an': 'Ninh Bình', 'tam cốc': 'Ninh Bình', 'bích động': 'Ninh Bình',
      'fansipan': 'Sa Pa', 'ruộng bậc thang': 'Sa Pa',
      'đỉnh bà đen': 'Tây Ninh',
      'núi bà rá': 'Bình Phước',
      'hang sơn đoòng': 'Quảng Bình', 'phong nha': 'Quảng Bình',
    };

    let specificLandmarkEarly = null;
    for (const kw of Object.keys(landmarkToProvinceEarly)) {
      if (lowerMsg.includes(kw)) {
        specificLandmarkEarly = kw;
        break;
      }
    }

    if (specificLandmarkEarly) {
      const match = cachedPlaces.find(p => p.name.toLowerCase().includes(specificLandmarkEarly.toLowerCase()));
      if (!match) {
        // CHỈ tắt isItineraryRequest khi người dùng KHÔNG có từ khóa lập lịch rõ ràng.
        // Nếu user nói "lập lịch đi Văn Miếu" thì vẫn phải cho tạo lịch trình.
        const hasExplicitItinKeyword = ['lên lịch', 'lập lịch', 'tạo lịch', 'lịch trình', 'kế hoạch', 'hành trình'].some(k => lowerMsg.includes(k));
        if (!hasExplicitItinKeyword) {
          isItineraryRequest = false;
          console.log(`🚫 [Landmark Guard] Landmark '${specificLandmarkEarly}' not in local DB & no explicit itinerary keyword. Forcing isItineraryRequest=false.`);
        } else {
          console.log(`✅ [Landmark Guard] Landmark '${specificLandmarkEarly}' has explicit itinerary keyword → allowing itinerary generation.`);
        }
      }
    }

    if (isItineraryRequest) {
      try {
        // Trích xuất thông tin từ tin nhắn - regex linh hoạt hơn
        let destMatch = message.match(/(?:Điểm đến|diem den):\s*([A-ZÀ-Ỹa-zà-ỹ][a-zà-ỹ]+(?:\s[A-ZÀ-Ỹa-zà-ỹ][a-zà-ỹ]+)*)/i);
        if (!destMatch) {
          destMatch = message.match(/(?:ở|tại|đến|đi du lịch|đi chuyến|khám phá)\s+([A-ZÀ-Ỹa-zà-ỹ][a-zà-ỹ]+(?:\s[A-ZÀ-Ỹa-zà-ỹ][a-zà-ỹ]+)*)/i);
        }
        if (!destMatch) {
          // Bắt thêm dạng "đi [địa danh]" (VD: "đi quốc tử giám") — nhưng loại bỏ "đi [số]" ("đi 1 ngày")
          destMatch = message.match(/(?:đi|về|thăm)\s+(?!\d)([a-zà-ỹ]+(?:\s[a-zà-ỹ]+){0,3})/i);
        }
        if (!destMatch) {
          destMatch = message.match(/([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s[A-ZÀ-Ỹ][a-zà-ỹ]+){0,2})\s+\d+\s*(?:ngày|ngay)/i);
        }
        if (!destMatch) {
          const popularDests = ['Hà Nội', 'Hồ Chí Minh', 'Sài Gòn', 'Đà Lạt', 'Đà Nẵng', 'Hội An', 'Nha Trang', 'Phú Quốc', 'Huế', 'Hạ Long', 'Sa Pa', 'Cần Thơ', 'Mũi Né', 'Phan Thiết', 'Tuyên Quang', 'Ninh Bình', 'Quy Nhơn', 'Bình Định', 'Vũng Tàu', 'Côn Đảo', 'Bình Thuận', 'Lào Cai', 'Điện Biên'];
          const found = popularDests.find(d => message.toLowerCase().includes(d.toLowerCase()));
          if (found) destMatch = [null, found];
        }
        // Fallback từ landmark cụ thể trong message
        if (!destMatch) {
          const knownLandmarks = ['quốc tử giám', 'văn miếu', 'hồ gươm', 'hoàn kiếm', 'hồ tây', 'tây hồ', 'bà nà', 'sơn trà', 'ngũ hành sơn', 'phố cổ hội an', 'tháp bà nha trang', 'bãi sao phú quốc', 'tràng an ninh bình', 'fansipan sa pa', 'dinh độc lập', 'bến thành'];
          const foundLm = knownLandmarks.find(lm => lowerMsg.includes(lm));
          if (foundLm) destMatch = [null, foundLm];
        }
        const daysMatch = message.match(/(\d+)\s*(?:ngày|ngay|day)/i);
        const budgetMatch = message.match(/(\d+)\s*(?:triệu|tr|trieu)/i);
        const autoGenKeywords = ['tùy mày', 'tùy m', 'tự động', 'auto', 'tùy ý', 'tự tạo', 'muốn gì cũng được', 'bất kỳ', 'tuy may', 'tuy m', 'tu dong', 'tuy y', 'tu tao', 'muon gi cung dooc', 'bat ky'];
        const isAutoGen = autoGenKeywords.some(k => lowerMsg.includes(k));

        let destination = semanticIntent.destination || (destMatch ? destMatch[1].trim() : null);
        
        // Loại bỏ các từ bị bắt nhầm
        if (destination) {
            const badDests = ['trình', 'kế hoạch', 'đi', 'đến', 'này', 'nhé', 'đó', 'đây', 'chơi', 'giúp', 'cho', 'nha', 'chuyến', 'với', 'điểm', 'diem', 'mấy', 'bao nhiêu', 'nhanh', 'nhanh nhất'];
            if (badDests.includes(destination.toLowerCase().trim()) || destination.trim().length < 3) {
                destination = null;
            }
        }
        
        const days = semanticIntent.days || (daysMatch ? parseInt(daysMatch[1]) : (isAutoGen ? 3 : null));
        const budget = semanticIntent.budget || (budgetMatch ? parseInt(budgetMatch[1]) : null);

        // Cứu cánh cho câu hỏi nối tiếp nếu không tìm thấy địa danh trực tiếp (duyệt ngược để tôn trọng thứ tự thời gian)
        if (!destination && chatHistory.length > 0) {
            const landmarkMap = {
                'quốc tử giám': 'Quốc Tử Giám', 'văn miếu': 'Quốc Tử Giám - Văn Miếu',
                'hồ gươm': 'Hà Nội', 'hoàn kiếm': 'Hà Nội', 'hồ tây': 'Hà Nội', 'tây hồ': 'Hà Nội',
                'sơn trà': 'Đà Nẵng', 'bà nà': 'Đà Nẵng', 'ngũ hành sơn': 'Đà Nẵng',
                'phố cổ hội an': 'Hội An', 'chùa cầu': 'Hội An',
                'fansipan': 'Sa Pa', 'ruộng bậc thang': 'Sa Pa',
                'tràng an': 'Ninh Bình', 'tam cốc': 'Ninh Bình',
                'hang sơn đoòng': 'Quảng Bình', 'phong nha': 'Quảng Bình',
                'dinh độc lập': 'Hồ Chí Minh', 'bến thành': 'Hồ Chí Minh',
                'bãi sao': 'Phú Quốc', 'phú quốc': 'Phú Quốc',
                'tháp bà': 'Nha Trang', 'vinpearl': 'Nha Trang',
                'khu di tích tân trào': 'Tuyên Quang', 'suối khoáng mỹ lâm': 'Tuyên Quang'
            };
            const provinces = ['Hà Nội', 'Hồ Chí Minh', 'Sài Gòn', 'Đà Lạt', 'Đà Nẵng', 'Hội An', 'Nha Trang', 'Phú Quốc', 'Huế', 'Hạ Long', 'Sa Pa', 'Cần Thơ', 'Mũi Né', 'Phan Thiết', 'Tuyên Quang', 'Ninh Bình', 'Quy Nhơn', 'Bình Định', 'Vũng Tàu', 'Côn Đảo', 'Sóc Sơn', 'Điện Biên', 'Lào Cai', 'Hà Giang', 'Yên Bái', 'Quảng Ninh'];

            for (let i = chatHistory.length - 1; i >= 0; i--) {
                const text = chatHistory[i].content.toLowerCase();
                
                // Ưu tiên 1: Tìm landmark cụ thể trong tin nhắn này
                let foundLm = null;
                for (const [kw, dest] of Object.entries(landmarkMap)) {
                    if (text.includes(kw)) {
                        if (!foundLm || kw.length > foundLm.kw.length) {
                            foundLm = { kw, dest };
                        }
                    }
                }
                if (foundLm) {
                    destination = foundLm.dest;
                    console.log(`[Itinerary Follow-up] Recovered destination from landmark in history: '${foundLm.kw}' → '${destination}'`);
                    break;
                }

                // Ưu tiên 2: Tìm tỉnh thành
                let foundProvince = null;
                for (const p of provinces) {
                    if (text.includes(p.toLowerCase())) {
                        if (!foundProvince || p.length > foundProvince.length) {
                            foundProvince = p;
                        }
                    }
                }
                if (foundProvince) {
                    destination = foundProvince;
                    console.log(`[Itinerary Follow-up] Recovered destination from province in history: '${destination}'`);
                    break;
                }
            }
        }
        // =============================================================
        // 🚫 Fix 2: Chặn tạo lịch trình nếu destination KHÔNG phải địa danh Việt Nam hợp lệ
        // Kiểm tra: nếu destination tìm được nhưng không nằm trong danh sách địa danh hợp lệ → hỏi lại
        if (destination) {
            const validProvinces = ['Hà Nội', 'Hồ Chí Minh', 'Sài Gòn', 'Đà Lạt', 'Đà Nẵng', 'Hội An', 'Nha Trang', 'Phú Quốc', 'Huế', 'Hạ Long', 'Sa Pa', 'Cần Thơ', 'Mũi Né', 'Phan Thiết', 'Tuyên Quang', 'Ninh Bình', 'Quy Nhơn', 'Bình Định', 'Vũng Tàu', 'Côn Đảo', 'Lào Cai', 'Điện Biên', 'Hà Giang', 'Lai Châu', 'Sơn La', 'Yên Bái', 'Thái Nguyên', 'Lạng Sơn', 'Cao Bằng', 'Bắc Kạn', 'Bắc Giang', 'Quảng Ninh', 'Phú Thọ', 'Vĩnh Phúc', 'Bắc Ninh', 'Hải Dương', 'Hải Phòng', 'Hưng Yên', 'Thái Bình', 'Hà Nam', 'Nam Định', 'Ninh Bình', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận', 'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng', 'Bình Phước', 'Tây Ninh', 'Bình Dương', 'Đồng Nai', 'Bà Rịa Vũng Tàu', 'Long An', 'Tiền Giang', 'Bến Tre', 'Trà Vinh', 'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Kiên Giang', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau', 'Cần Thơ'];
            const knownLandmarks = ['quốc tử giám', 'văn miếu', 'hồ gươm', 'hoàn kiếm', 'hồ tây', 'tây hồ', 'bà nà', 'sơn trà', 'ngũ hành sơn', 'phố cổ', 'chùa cầu', 'tháp bà', 'vinpearl', 'dinh độc lập', 'bến thành', 'tràng an', 'tam cóc', 'fansipan', 'ruộng bậc thang', 'đỉnh bà đen', 'hang sơn đoòng', 'phong nha', 'cáp treo hòn thơm', 'bãi sao', 'lăng bác', 'chùa một cột', 'ba đình', 'bát tràng', 'thăng long', 'bích động', 'núi bà rá'];
            
            const destLower = destination.toLowerCase();
            const isValidProvince = validProvinces.some(p => destLower.includes(p.toLowerCase()) || p.toLowerCase().includes(destLower));
            const isValidLandmark = knownLandmarks.some(lm => destLower.includes(lm) || lm.includes(destLower));
            
            if (!isValidProvince && !isValidLandmark) {
                // Loại bỏ các từ bị bắt nhầm
                const badWords = ['học', 'làm', 'kiếm tiền', 'chữa bệnh', 'thi', 'ôn bài', 'trình', 'kế hoạch', 'chơi', 'đi', 'đến', 'mấy', 'bao nhiêu', 'nhanh'];
                const hasBadWord = badWords.some(bw => destLower.includes(bw));
                
                if (hasBadWord || destination.trim().length < 3) {
                    isItineraryRequest = false;
                    throw new Error("bypass_itinerary_generation");
                }
            }
        }
        // =============================================================

        // Bỏ qua tạo lịch trình nếu intent parser báo OffTopic và không có từ khóa lập lịch rõ ràng / không tìm thấy điểm đến
        const hasExplicitItinKeyword = itineraryKeywords.some(k => lowerMsg.includes(k)) || 
                                       (lowerMsg.includes('lịch') && lowerMsg.includes('trình')) ||
                                       (lowerMsg.includes('kế') && lowerMsg.includes('hoạch'));

        if (semanticIntent.isOffTopic && !hasExplicitItinKeyword && !destination) {
            isItineraryRequest = false;
            throw new Error("bypass_itinerary_generation");
        }

        if (!destination) {
            isItineraryRequest = false;
            throw new Error("bypass_itinerary_generation");
        }

        const finalDest = destination;
        const finalDays = days || 3;
        let parsedBudget = parseFloat(budget) || 5;
        if (parsedBudget >= 1000000) parsedBudget = parsedBudget / 1000000;
        else if (parsedBudget >= 1000) parsedBudget = parsedBudget / 1000;
        const finalBudget = Math.round(parsedBudget * 10) / 10;
        const companion = semanticIntent.companion || "Bạn bè";
        const interests = semanticIntent.interests || "";

        let wikiContext = "";
        try {
          const wikiKey = `WIKI_${finalDest.toLowerCase()}`;
          const wikiRecord = preFetchedWiki || await Knowledge.findOne({ question: wikiKey });
          if (wikiRecord && wikiRecord.answer) {
            wikiContext = wikiRecord.answer;
            if (wikiContext.length > 3000) wikiContext = wikiContext.substring(0, 3000) + "...";
          }
        } catch (e) {
          console.warn("Lỗi lấy wiki context cho itinerary:", e.message);
        }

        const localPlacesContext = await getLocalPlacesContext(finalDest);

        console.log(`✈️ [Itinerary] Creating 3 Premium Plans (70B) for: ${finalDest}, ${finalDays} ngày, ${finalBudget}tr...`);

        const styles = [
            { title: "Khám phá & Bản sắc 🏛️", vibe: "Khám phá bản sắc lịch sử, di tích văn hóa, danh lam thắng cảnh và ẩm thực truyền thống", pace: "Vừa phải", transport: "Xe máy/Taxi", accommodation: "Khách sạn trung tâm hoặc Homestay bản địa" },
            { title: "Nghỉ dưỡng & Cafe Chill ☕", vibe: "Nghỉ dưỡng thư thái, check-in quán cafe đẹp, tận hưởng thiên nhiên thanh bình và ăn uống nhẹ nhàng", pace: "Thong thả", transport: "Taxi/Ô tô", accommodation: "Resort nghỉ dưỡng hoặc Khách sạn cao cấp" },
            { title: "Năng động & Trải nghiệm 🎒", vibe: "Khám phá thiên nhiên kỳ thú, trekking, trải nghiệm thực tế cuộc sống bản địa và ẩm thực đường phố", pace: "Năng động", transport: "Xe máy", accommodation: "Homestay nhà dân hoặc Hostel" }
        ];

        const generatePlanForStyle = async (dest, daysVal, budgetVal, styleObj, localCtx = "", wikiCtx = "") => {
            const prompt = `Bạn là SIÊU KIẾN TRÚC SƯ LỊCH TRÌNH của WanderViet AI. Hãy tạo một lịch trình du lịch TỐI ƯU BỞI AI cho điểm đến ${dest} trong ${daysVal} ngày.
            
            === THÔNG TIN DỮ LIỆU ĐỊA PHƯƠNG KHẢO SÁT (BẮT BUỘC SỬ DỤNG CÁC ĐỊA DANH THỰC TẾ NÀY, TUYỆT ĐỐI KHÔNG BỊA ĐẶT HOẶC LẤY ĐỊA DANH NƠI KHÁC NẾU KHÔNG CÓ TRONG ĐÂY) ===
            ${localCtx ? `Địa điểm từ hệ thống:\n${localCtx}` : ''}
            ${wikiCtx ? `Thông tin giới thiệu & địa danh từ Wikipedia:\n${wikiCtx}` : ''}
            
            === THÔNG TIN PHONG CÁCH ===
            - Tên phong cách: ${styleObj.title}
            - Vibe chủ đạo: ${styleObj.vibe}
            - Nhịp độ di chuyển: ${styleObj.pace}
            - Phương tiện di chuyển: ${styleObj.transport}
            - Loại lưu trú đề xuất: ${styleObj.accommodation}
            - Ngân sách ước lượng: ${budgetVal} triệu VNĐ

            === QUY TẮC PHÂN TỔ HOẠT ĐỘNG ===
            Mỗi ngày phải có ít nhất 3-4 hoạt động chính: Ăn sáng/Tham quan sáng, Ăn trưa, Cafe/Tham quan chiều, Ăn tối/Chơi tối. Tất cả mô tả địa điểm phải thực tế, cụ thể ở ${dest}.

            === FORMAT JSON ĐẦU RA (BẮT BUỘC CHỈ TRẢ VỀ JSON NÀY) ===
            {
              "tripSummary": "Mô tả đầy cảm xúc về chuyến đi...",
              "estimatedCost": "${budgetVal} triệu VNĐ",
              "emotionalTone": "Tông màu cảm xúc (VD: Yên bình, Hào hứng...)",
              "accommodationSuggestion": {
                "typeLabel": "${styleObj.accommodation}",
                "icon": "🏨",
                "nameAndCost": "Khách sạn/Homestay đề xuất - Giá",
                "reason": "Lý do chọn..."
              },
              "itinerary": [
                {
                  "day": "1",
                  "highlight": "Trải nghiệm đặc biệt nhất trong ngày",
                  "activities": [
                    {
                      "time": "08:00",
                      "session": "Sáng|Chiều|Tối",
                      "task": "Thưởng thức món ngon đặc sản bản địa đầu ngày...",
                      "location": "Tên địa điểm cụ thể",
                      "address": "Địa chỉ thực tế",
                      "cost": "50.000đ hoặc Miễn phí",
                      "transport": "Xe máy/Đi bộ",
                      "rating": 4.5,
                      "description": "Mô tả chi tiết 2-3 câu về địa điểm",
                      "visualNote": "Góc chụp ảnh đẹp",
                      "transitToNext": "Hướng dẫn di chuyển đến điểm tiếp theo"
                    }
                  ]
                }
              ]
            }`;

            const comp = await createGroqChatCompletion({
                messages: [
                    { role: 'system', content: 'Bạn là chuyên gia lịch trình thực địa Việt Nam. CHỈ trả về JSON. Mỗi ngày BẮT BUỘC 5-6 hoạt động chi tiết với địa điểm, giá, mô tả thực tế. KHÔNG bịa đặt.' },
                    { role: 'user', content: prompt }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.6,
                response_format: { type: 'json_object' },
                max_tokens: 4000
            }, false);

            let raw = comp.choices[0]?.message?.content || '{}';
            // Dọn dẹp markdown code block ticks mà Groq đôi khi tự thêm vào
            raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            const parsed = JSON.parse(raw);
            // Kiểm tra bắt buộc: phải có trường itinerary hợp lệ
            if (!parsed.itinerary || !Array.isArray(parsed.itinerary) || parsed.itinerary.length === 0) {
              console.warn(`⚠️ [generatePlanForStyle] Plan thiếu trường itinerary hợp lệ cho ${dest}, rơi vào fallback mẫu.`);
              throw new Error('Plan missing itinerary field');
            }
            return parsed;
        };

        const plans = await Promise.all(styles.map(style => 
            generatePlanForStyle(finalDest, finalDays, finalBudget, style, localPlacesContext, wikiContext)
                .then(plan => {
                    plan.destination = finalDest;
                    plan.days = finalDays;
                    return plan;
                })
                .catch(err => {
                    console.error("Lỗi tạo plan cho style:", style.title, err.message);
                    const fallback = createDefaultFallbackPlan(finalDest, finalDays, finalBudget, style);
                    fallback.destination = finalDest;
                    fallback.days = finalDays;
                    return fallback;
                })
        ));

        // Lấy thông tin user đăng nhập
        let userName = 'Khách vãng lai';
        let userEmail = '';
        if (req.user) {
          const userDoc = await User.findById(req.user.id);
          if (userDoc) {
            userName = userDoc.displayName || userDoc.name || 'Thành viên WanderViet AI';
            userEmail = userDoc.email || '';
          }
        }

        let savedProposals = [];
        // Luôn lưu proposals bất kể clientDisconnected - response vẫn có thể gửi được
        const itineraryPromises = plans.map(async (plan, i) => {
            if (!plan || !plan.itinerary) return null;
            const styleObj = styles[i];

            // Try-catch cục bộ: nếu save DB thất bại, sinh mock_id tạm thời
            // để luồng KHÔNG bị đổ và client vẫn nhận được planJson qua sessionStorage
            let savedId;
            try {
              const itinerary = new Itinerary({
                userId: req.user ? req.user.id : null,
                destination: String(finalDest),
                days: Number(finalDays),
                budget: `${finalBudget} triệu VNĐ`,
                companion: String(companion),
                interests: String(interests || styleObj.vibe),
                planJson: plan,
                userName,
                userEmail,
                isDraft: true // Nháp
              });
              const saved = await itinerary.save();
              savedId = saved._id.toString();
            } catch (saveErr) {
              console.error(`⚠️ [Itinerary Save] Lỗi lưu DB cho style "${styleObj.title}":`, saveErr.message);
              // Sinh mock_id tạm — client sẽ dùng planJson từ sessionStorage thay vì fetch API
              savedId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            }

            return {
              _id: savedId,
              title: styleObj.title,
              destination: finalDest,
              days: finalDays,
              budget: `${finalBudget} triệu VNĐ`,
              style: styleObj.title,
              description: plan.tripSummary || styleObj.vibe,
              planJson: plan  // Đính kèm planJson để client lưu vào sessionStorage
            };
          });
          const results = await Promise.all(itineraryPromises);
          savedProposals = results.filter(p => p !== null);

        if (savedProposals.length > 0) {
          // Tạo bản nhẹ (không có planJson) để nhúng vào summaryMsg text — tránh bloat DB
          const lightProposals = savedProposals.map(({ planJson, ...rest }) => rest);
          const summaryMsg = `Dựa trên sở thích của bạn, Trợ lý WanderViet AI đã thiết kế riêng **3 phương án lịch trình thực tế** siêu chất lượng tại **${finalDest}** trong **${finalDays} ngày**.

Hãy bấm vào phương án bạn thích bên dưới để chuyển trực tiếp đến **Travel Planner AI** xem chi tiết bản đồ di chuyển, gợi ý phòng, dự trù ngân sách và video review nhé! 👇\n[ITIN_PROPOSALS:${JSON.stringify(lightProposals)}]`;

          if (chatbotDb.readyState === 1) {
            if (!currentSessionId) currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'user', text: message }).save();
            await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'model', text: summaryMsg, hasProposal: true }).save();
          }

          return res.json({
            success: true,
            answer: summaryMsg,
            sessionId: currentSessionId,
            proposals: savedProposals,  // Bản đầy đủ có planJson → client dùng sessionStorage
            source: 'itinerary-proposal-generator-v3-premium'
          });
        }
      } catch (itinErr) {
        if (itinErr.message !== "bypass_itinerary_generation") {
          console.error('Lỗi generate lịch trình premium:', itinErr.message);
        }
      }
    }

    // Nếu isItineraryRequest nhưng block trên không return (proposals bị lỗi/bỏ qua),
    // ép system prompt KHÔNG cho AI viết lịch trình text dài — chỉ trả lời ngắn gọn
    if (isItineraryRequest) {
      systemPrompt += `\n\n[CHỈ THỊ KHẨN CẤP - ƯU TIÊN CAO NHẤT]: TUYỆT ĐỐI KHÔNG ĐƯỢC viết lịch trình chi tiết (Ngày 1, Ngày 2, Ngày 3...). Hệ thống đã tự động tạo các phương án lịch trình dưới dạng thẻ tương tác bên dưới. Bạn CHỈ ĐƯỢC viết TỐI ĐA 2-3 câu ngắn gọn thông báo rằng đã tạo xong lịch trình và mời khách bấm xem các phương án bên dưới. KHÔNG viết bảng, KHÔNG liệt kê hoạt động, KHÔNG mô tả chi tiết ngày.`;
    }

    try {
      // Smart routing: Use 70B model only for itinerary/planning queries, and 8B for normal queries
      const chosenModel = isItineraryRequest ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";
      console.log(`🤖 [Chatbot Routing] Using model: ${chosenModel} (isItineraryRequest=${isItineraryRequest})`);

      // Ép model tuân thủ ngôn ngữ bằng cách nhúng thẳng lệnh vào câu hỏi cuối cùng
      let finalUserMessage = message;
      if (targetLang !== 'auto') {
        const langName = languageNames[targetLang] || 'Tiếng Việt';
        finalUserMessage = `${message}\n\n[SYSTEM INSTRUCTION: You MUST reply in ${langName}. Do NOT use any other language.]`;
      } else {
        finalUserMessage = `${message}\n\n[SYSTEM INSTRUCTION: Detect the language of my message and reply in that same language.]`;
      }

      // 4. MÔ HÌNH SUY LUẬN CHÍNH (MAIN REASONING MODEL) - Sử dụng Model đã định tuyến hoặc Vision nếu có hình ảnh
      const isBiz = userRole === 'business';
      
        let completion;
        if (images && images.length > 0) {
          // 1. Phân tích hình ảnh bằng model Vision (sử dụng API key vision chuyên dụng qua rotator)
          console.log(`🖼️ [Vision Analyzer] Analyzing ${images.length} image(s) in parallel...`);
          const imageAnalyses = (await Promise.all(images.map(async (imgUrl, i) => {
            try {
              const analysisCompletion = await createGroqChatCompletion({
                messages: [{
                  role: "user",
                  content: [
                    { type: "text", text: "Phân tích hình ảnh: nhận diện địa điểm, danh lam, món ăn, hoạt động du lịch VN. Mô tả ngắn gọn nội dung và bầu không khí. Trả lời tiếng Việt." },
                    { type: "image_url", image_url: { url: imgUrl } }
                  ]
                }],
                model: "llama-3.2-11b-vision",
                temperature: 0.2,
                max_tokens: 500
              }, false);
              const desc = analysisCompletion.choices[0]?.message?.content;
              return desc ? `[Hình ảnh ${i + 1}]: ${desc}` : null;
            } catch (visionErr) {
              console.warn(`⚠️ [Vision Error] Image ${i + 1}:`, visionErr.message);
              return null;
            }
          }))).filter(Boolean);

          // Ghép thông tin mô tả hình ảnh vào tin nhắn gửi chatbot chính
          let finalUserMessageWithImageContext = finalUserMessage;
          if (imageAnalyses.length > 0) {
            finalUserMessageWithImageContext = `[THÔNG TIN PHÂN TÍCH HÌNH ẢNH MÀ NGƯỜI DÙNG TẢI LÊN]:\n${imageAnalyses.join('\n')}\n\n[CÂU HỎI VÀ YÊU CẦU CỦA NGƯỜI DÙNG]:\n${finalUserMessage}`;
          }

          // 2. Chatbot chính trả lời dựa trên thông tin mô tả ảnh
          try {
            console.log(`🤖 [Chatbot Reasoning] Formulating response using ${chosenModel}...`);
            completion = await createGroqChatCompletion({
              messages: [
                { role: "system", content: systemPrompt },
                ...chatHistory,
                { role: "user", content: finalUserMessageWithImageContext }
              ],
              model: chosenModel,
              temperature: 0.3,
              max_tokens: 1000
            }, isBiz);
          } catch (err70b) {
            console.warn(`⚠️ [Groq Fallback] Chosen model ${chosenModel} failed/rate-limited during vision phase, falling back to 8B Model:`, err70b.message);
            completion = await createGroqChatCompletion({
              messages: [
                { role: "system", content: systemPrompt },
                ...chatHistory,
                { role: "user", content: finalUserMessageWithImageContext }
              ],
              model: "llama-3.1-8b-instant",
              temperature: 0.3,
              max_tokens: 1000
            }, isBiz);
          }
        } else {
          // Text-only flow
          try {
            console.log(`🤖 [Chatbot Reasoning] Formulating response using ${chosenModel}...`);
            completion = await createGroqChatCompletion({
              messages: [
                { role: "system", content: systemPrompt },
                ...chatHistory,
                { role: "user", content: finalUserMessage }
              ],
              model: chosenModel,
              temperature: 0.3,
              max_tokens: 1000
            }, isBiz);
          } catch (err70b) {
            console.warn(`⚠️ [Groq Fallback] Chosen model ${chosenModel} failed/rate-limited, falling back to 8B Model:`, err70b.message);
            completion = await createGroqChatCompletion({
              messages: [
                { role: "system", content: systemPrompt },
                ...chatHistory,
                { role: "user", content: finalUserMessage }
              ],
              model: "llama-3.1-8b-instant",
              temperature: 0.3,
              max_tokens: 1000
            }, isBiz);
          }
        }

        let aiAnswer = completion.choices[0]?.message?.content || "Mình chưa nghe rõ, bạn nói lại nhé!";

      // 4.5. MÔ HÌNH KIỂM DUYỆT (VERIFIER AI) - Đã gỡ bỏ để tăng tốc độ phản hồi và chống lỗi dịch tiếng Trung ngẫu nhiên.
      // Thay vào đó, model 70B với temperature 0.3 đã đủ độ tin cậy để xử lý ngữ cảnh 12,000 ký tự.

      // 5. LƯU TRÍ NHỚ SONG SONG (Ghi vào DB Server theo Session)
      if (chatbotDb.readyState === 1 && aiAnswer && !clientDisconnected) {
        try {
          if (!currentSessionId) {
            currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          }

          let title = undefined;
          const firstMsgCount = await Conversation.countDocuments({ sessionId: currentSessionId });
          if (firstMsgCount === 0) {
            let cleanMsg = (message || "Hình ảnh").replace(/[?.,!]/g, '').trim();
            title = cleanMsg.split(' ').slice(0, 6).join(' ');
            if (cleanMsg.split(' ').length > 6) title += '...';
            if (!title) title = 'Hội thoại mới';
          }

          const userMsgPromise = new Conversation({
            userId: sessionKey,
            sessionId: currentSessionId,
            title: title,
            role: 'user',
            text: message || "",
            images: images || []
          }).save();

          const modelMsgPromise = new Conversation({
            userId: sessionKey,
            sessionId: currentSessionId,
            role: 'model',
            text: aiAnswer
          }).save();

          const [userDoc, answerDoc] = await Promise.all([userMsgPromise, modelMsgPromise]);
          res.locals.messageId = answerDoc._id;
        } catch (saveErr) {
          console.error("Lỗi lưu trí nhớ song song:", saveErr.message);
        }
      } else if (chatbotDb.readyState !== 1) {
        console.warn("⚠️ Chatbot DB not ready (readyState: " + chatbotDb.readyState + "). Message not saved.");
      }

      const finalMeta = await generateResponseMetadata(message, aiAnswer, locationContext, isItineraryRequest);

      // Khi KHÔNG có tour trong DB nhưng user hỏi về tour/dịch vụ → nhúng link vào câu trả lời AI
      if (finalMeta.suggestedLink && (!finalMeta.suggestedTours || finalMeta.suggestedTours.length === 0)) {
        const linkMd = `[👉 ${finalMeta.suggestedLink.label}](${finalMeta.suggestedLink.url})`;
        aiAnswer = aiAnswer.trim() + '\n\n' + linkMd;
      }

      res.json({
        success: true,
        answer: aiAnswer,
        sessionId: currentSessionId,
        messageId: res.locals.messageId || null,
        proposal: finalMeta.proposal,
        discoveryPlaces: finalMeta.discoveryPlaces,
        suggestedTours: finalMeta.suggestedTours,
        suggestedLink: finalMeta.suggestedLink,
        source: 'wanderviet-ai-gen3-ultimate'
      });
      
      // --- BACKGROUND LEARNING (ASYNCHRONOUS) ---
      // AI tự học từ cuộc hội thoại để bồi đắp trí nhớ dài hạn
      if (req.user && req.user.id && message.length > 5) {
          (async () => {
              try {
                  const learnCompletion = await createGroqChatCompletion({
                      messages: [
                          { role: "system", content: "BẠN LÀ BỘ NÃO SIÊU VIỆT. Nhiệm vụ: Trích xuất thông tin CỐT LÕI từ tin nhắn để AI ghi nhớ lâu dài. \nPhân loại: \n1. [SỞ THÍCH]: Đồ ăn, phong cảnh, thói quen... \n2. [SỰ KIỆN]: Đang đi với ai, đang ở đâu, chuyện đã xảy ra... \n3. [TÂM TRẠNG]: Buồn, vui, mệt mỏi, hào hứng... \nChỉ trả về DUY NHẤT 1 câu tổng hợp cực ngắn gọn. Nếu không có gì đáng nhớ, trả về 'NULL'." },
                          { role: "user", content: `Tin nhắn: "${message}"` }
                      ],
                      model: "llama-3.1-8b-instant",
                      temperature: 0.1,
                      max_tokens: 80
                  }, false);
                  
                  const insight = learnCompletion.choices[0]?.message?.content;
                  if (insight && insight !== 'NULL' && insight.length > 3) {
                      await User.findByIdAndUpdate(req.user.id, {
                          $push: { "preferenceProfile.aiInsights": { $each: [insight], $slice: -20 } } // Giữ tối đa 20 insights gần nhất
                      });
                      // console.log("🧠 [Learning] Đã ghi nhớ thêm:", insight);
                  }
              } catch (err) {
                  // Im lặng lỗi ở background để không ảnh hưởng user
              }
          })();
      }

    } catch (groqError) {
      console.error('❌ Groq API Error:', groqError.message);
      res.json({ success: false, answer: "Bộ não AI siêu tốc đang bảo trì, vui lòng thử lại sau!" });
    }
  } catch (error) {
    console.error('Critical Chat Error:', error.message);
    res.json({ success: false, answer: 'Lỗi hệ thống.' });
  }
});

// Lấy danh sách các phiên chat của người dùng
router.get('/sessions', optionalAuth, async (req, res) => {
  try {
    const sessionKey = req.user ? req.user.id : (req.query.deviceId || 'anonymous_guest');
    console.log("🔍 Fetching sessions for userId:", sessionKey);

    // Group by sessionId to get unique sessions
    const sessions = await Conversation.aggregate([
      { $match: { userId: sessionKey, sessionId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$sessionId",
          title: { $max: "$title" },
          updatedAt: { $max: "$timestamp" },
          msgCount: { $sum: 1 }
        }
      },
      { $match: { msgCount: { $gt: 0 } } },
      { $sort: { updatedAt: -1 } },
      { $limit: 20 }
    ]);

    const formatted = await Promise.all(sessions.map(async s => {
      let displayTitle = s.title;
      const sid = s._id;

      if (!displayTitle || displayTitle.trim() === 'Hội thoại mới' || displayTitle === 'null' || displayTitle === 'undefined') {
        const firstUserMsg = await Conversation.findOne({ sessionId: sid, role: 'user' }).sort({ timestamp: 1 });
        if (firstUserMsg && firstUserMsg.text) {
          let clean = firstUserMsg.text.replace(/[?.,!]/g, '').trim();
          displayTitle = clean.split(' ').slice(0, 8).join(' ');
          if (clean.split(' ').length > 8) displayTitle += '...';
        }
      }

      if (!displayTitle) displayTitle = 'Hội thoại du lịch';

      return {
        sessionId: sid,
        title: displayTitle,
        updatedAt: s.updatedAt
      };
    }));

    res.json({ success: true, sessions: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách phiên.' });
  }
});

// Lấy lịch sử chi tiết của một phiên
router.get('/history/:sid', optionalAuth, async (req, res) => {
  try {
    const { sid } = req.params;
    const messages = await Conversation.find({ sessionId: sid }).sort({ timestamp: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải lịch sử.' });
  }
});

// Xóa một phiên chat
router.delete('/session/:sid', optionalAuth, async (req, res) => {
  try {
    const { sid } = req.params;
    const sessionKey = req.user ? req.user.id : (req.query.deviceId || 'anonymous_guest');

    // Đảm bảo người dùng chỉ xóa được chat của chính họ
    const result = await Conversation.deleteMany({ sessionId: sid, userId: sessionKey });

    if (result.deletedCount > 0) {
      res.json({ success: true, message: 'Đã xóa hội thoại.' });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy hội thoại hoặc không có quyền xóa.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa hội thoại.' });
  }
});

// Nhận phản hồi RLHF từ người dùng
router.post('/feedback', optionalAuth, async (req, res) => {
  try {
    const { messageId, feedback, reason } = req.body;
    if (!messageId || !['up', 'down', 'none'].includes(feedback)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ.' });
    }

    const sessionKey = req.user ? req.user.id : (req.query.deviceId || 'anonymous_guest');
    
    // Cập nhật phản hồi vào Conversation
    const updated = await Conversation.findOneAndUpdate(
      { _id: messageId, userId: sessionKey },
      { $set: { feedback, feedbackReason: reason || '' } },
      { returnDocument: 'after' }
    );

    if (updated) {
      res.json({ success: true, message: 'Cảm ơn phản hồi của bạn!' });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy tin nhắn.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

module.exports = router;
