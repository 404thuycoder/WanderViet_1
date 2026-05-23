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
  const category = isBusiness ? 'business' : 'user_chatbot';
  return await callGroq(category, params);
}

// Middleware xác thực tùy chọn
const optionalAuth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded.user | decoded.account | decoded;
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

// --- HELPER: GENERATE RESPONSE METADATA (PROPOSALS, DISCOVERY, TOURS) ---
async function generateResponseMetadata(message, aiAnswer, locationContext, isItineraryRequest = false) {
  let proposal = null;
  let discoveryPlaces = null;
  let suggestedTours = null;

  const safeAnswer = (typeof aiAnswer === 'string' && aiAnswer.length > 0) ? aiAnswer : '';
  const lowerAnswer = safeAnswer.toLowerCase();
  const lowerUserMsg = message.toLowerCase();
  const weatherKeywords = ['thời tiết', 'mát', 'đẹp trời', 'nắng', 'đi chơi', 'thoi tiet', 'dep troi', 'di choi'];
  const isWeatherContext = weatherKeywords.some(k => lowerUserMsg.includes(k) || lowerAnswer.includes(k));

  // 1. Tự động nhận diện Tỉnh/Thành/Địa điểm được hỏi
  const provinces = [
    'Hà Nội', 'Hồ Chí Minh', 'Sài Gòn', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Lào Cai', 'Sa Pa', 'Yên Bái', 'Điện Biên', 'Lai Châu', 'Sơn La', 'Hòa Bình', 'Hà Giang', 'Tuyên Quang', 'Cao Bằng', 'Bắc Kạn', 'Thái Nguyên', 'Lạng Sơn', 'Bắc Giang', 'Quảng Ninh', 'Hạ Long', 'Phú Thọ', 'Vĩnh Phúc', 'Bắc Ninh', 'Hải Dương', 'Hưng Yên', 'Thái Bình', 'Hà Nam', 'Nam Định', 'Ninh Bình', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế', 'Huế', 'Quảng Nam', 'Hội An', 'Quảng Ngãi', 'Bình Định', 'Quy Nhơn', 'Phú Yên', 'Khánh Hòa', 'Nha Trang', 'Ninh Thuận', 'Bình Thuận', 'Mũi Né', 'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng', 'Đà Lạt', 'Bình Phước', 'Tây Ninh', 'Bình Dương', 'Đồng Nai', 'Bà Rịa Vũng Tàu', 'Vũng Tàu', 'Long An', 'Tiền Giang', 'Bến Tre', 'Trà Vinh', 'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Kiên Giang', 'Phú Quốc', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau'
  ];

  // Map địa danh/di tích nổi tiếng → tỉnh thành chính xác để lọc tour/discovery
  const landmarkToProvince = {
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

  // Ưu tiên: trích xuất tên địa danh/di tích CỤ THỂ từ message
  let specificLandmark = null;
  for (const [kw, prov] of Object.entries(landmarkToProvince)) {
    if (lowerUserMsg.includes(kw) | lowerAnswer.includes(kw)) {
      specificLandmark = kw; // giữ nguyên tên landmark gốc
      break;
    }
  }

  let detectedDest = null;
  if (specificLandmark) {
    detectedDest = landmarkToProvince[specificLandmark];
  } else {
    // ƯU TIÊN 1: Tìm trong câu hỏi của người dùng trước
    for (const p of provinces) {
      if (lowerUserMsg.includes(p.toLowerCase())) {
        detectedDest = p;
        break;
      }
    }
    // ƯU TIÊN 2: Nếu người dùng không nhắc, mới tìm trong câu trả lời của AI
    if (!detectedDest) {
      for (const p of provinces) {
        if (lowerAnswer.includes(p.toLowerCase())) {
          detectedDest = p;
          break;
        }
      }
    }
    // ƯU TIÊN 3: Dùng Regex bắt các địa danh cấp huyện (như Sóc Sơn) không có trong list tỉnh thành
    if (!detectedDest) {
       let destMatch = lowerUserMsg.match(/(?:ở|tại|đến|đi|cho|tìm|về)\s+([a-zà-ỹ]+(?:\s[a-zà-ỹ]+){1,3})/i);
       if (destMatch) {
           const captured = destMatch[1].trim();
           const badDests = ['trình', 'kế hoạch', 'đi', 'đến', 'này', 'nhé', 'đó', 'đây', 'chơi', 'giúp', 'cho', 'nha', 'chuyến', 'với', 'nhé', 'điểm', 'diem', 'tour', 'dịch vụ', 'khách sạn', 'đâu', 'đâu không', 'gì'];
           if (!badDests.includes(captured) && captured.length > 2) {
               detectedDest = captured;
           }
       }
    }
  }

  // 2. Tự động nhận diện Style/Thể loại du lịch từ tags
  let detectedTags = [];
  if (lowerUserMsg.includes('biển') | lowerAnswer.includes('biển') | lowerUserMsg.includes('đảo') | lowerAnswer.includes('đảo')) {
    detectedTags.push('biển');
  }
  if (lowerUserMsg.includes('núi') | lowerAnswer.includes('núi') | lowerUserMsg.includes('trekking') | lowerAnswer.includes('trekking') | lowerUserMsg.includes('leo núi') | lowerAnswer.includes('leo núi')) {
    detectedTags.push('leo núi');
  }
  if (lowerUserMsg.includes('văn hóa') | lowerAnswer.includes('văn hóa') | lowerUserMsg.includes('lịch sử') | lowerAnswer.includes('lịch sử') | lowerUserMsg.includes('di tích') | lowerAnswer.includes('di tích') | lowerUserMsg.includes('phố cổ') | lowerAnswer.includes('phố cổ') | lowerUserMsg.includes('chùa') | lowerAnswer.includes('chùa') | lowerUserMsg.includes('đền') | lowerAnswer.includes('đền')) {
    detectedTags.push('văn hóa');
  }
  if (lowerUserMsg.includes('ẩm thực') | lowerAnswer.includes('ẩm thực') | lowerUserMsg.includes('ăn uống') | lowerAnswer.includes('ăn uống') | lowerUserMsg.includes('đặc sản') | lowerAnswer.includes('đặc sản')) {
    detectedTags.push('ẩm thực');
  }
  if (lowerUserMsg.includes('nghỉ dưỡng') | lowerAnswer.includes('nghỉ dưỡng') | lowerUserMsg.includes('resort') | lowerAnswer.includes('resort')) {
    detectedTags.push('nghỉ dưỡng');
  }

  // A. Tự tạo Proposal (Lịch trình nhanh) - tạo khi isItineraryRequest=true (không cần AI text phải chứa keyword)
  if (isItineraryRequest) {
      if (isWeatherContext) {
          proposal = {
              destination: detectedDest | locationContext | "vùng lân cận",
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
    const shouldShowDiscovery = lowerAnswer.includes('địa điểm') | lowerAnswer.includes('quán') | lowerAnswer.includes('nơi') | lowerAnswer.includes('khám phá') | lowerAnswer.includes('gợi ý') | isWeatherContext | detectedDest | detectedTags.length > 0;
    
    if (shouldShowDiscovery) {
      let filtered = cachedPlaces;
      
      if (detectedDest) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(detectedDest.toLowerCase()) | 
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
          if (!detectedDest && (lowerUserMsg.length < 15 | ['alo', 'chào', 'hi', 'hello'].some(k => lowerUserMsg.includes(k)))) {
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
  let searchDest = detectedDest | (proposal ? proposal.destination : null);

  if (wantsTour | wantsService | isItineraryRequest) {
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
            // Không hỏi địa danh, nhưng hỏi theo thể loại (VD: tour leo núi, khách sạn biển...)
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
            console.log(`[Tour Search] Tags only → found ${suggestedTours.length} results`);
        } else if (wantsTour | wantsService) {
            // Hỏi tour chung chung không có địa danh → fallback nổi bật
            suggestedTours = await Place.find({ isDeleted: { $ne: true }, status: 'approved' }).sort({ favoritesCount: -1 }).limit(5).lean();
            console.log(`[Tour Search] Generic fallback → found ${suggestedTours.length} results`);
        }
    } catch (tourErr) {
        console.error("Error fetching suggested services:", tourErr);
    }

    if (!suggestedTours) {
        suggestedTours = [];
    }
  }

  console.log(`[Metadata] Suggested Services/Tours count: ${suggestedTours ? suggestedTours.length : 0}`);
  return { proposal, discoveryPlaces, suggestedTours };
}

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { message, coords, itinerary, activeTrip, deviceId, role, sessionId, placeContext } = req.body;
    let currentSessionId = sessionId;

    if (!message) {
      return res.status(400).json({ success: false, answer: 'Vui lòng nhập câu hỏi.' });
    }

    // Định danh người dùng/phiên
    const sessionKey = req.user ? req.user.id : (deviceId | 'anonymous_guest');
    const targetLang = req.body.lang | 'auto';
    const scope = req.body.scope | 'user_portal';

    // ═════ SEMANTIC INTENT CLASSIFIER (PRE-ROUTER) ═════
    let semanticIntent = {
      isSensitive: false,
      isOffTopic: false,
      isItineraryRequest: false,
      destination: null,
      days: null,
      budget: null
    };

    // Chỉ thực hiện phân tích ngữ cảnh nâng cao cho user_portal
    if (scope === 'user_portal' && !placeContext) {
      try {
        const routeCompletion = await createGroqChatCompletion({
          messages: [
            {
              role: 'system',
              content: `Bạn là bộ não phân tích ý định người dùng của hệ thống WanderViet AI - nền tảng du lịch Việt Nam.
Hãy phân tích NGỮ CẢNH TOÀN VẸN, không đọc từng từ riêng lẻ.

QUY TẮC QUAN TRỌNG NHẤT (BẮT BUỘC):
- Nếu tin nhắn chứa TÊN ĐỊA DANH (tỉnh, thành, di tích, địa điểm), hoặc các từ liên quan LỊCH TRÌNH/DU LỊCH (lịch, ngày, tour, biển, núi, rừng, khách sạn, ăn uống, tham quan...) → isOffTopic PHẢI là false.
- Nếu isItineraryRequest là true HOẶC destination không phải null → isOffTopic PHẢI là false. Không được có mâu thuẫn.
- "lập lịch", "tạo lịch", "lên kế hoạch", "đi chơi", "đi du lịch", "đi biển", "đi núi" → isItineraryRequest: true, isOffTopic: false.
- Chỉ đặt isOffTopic: true khi câu hỏi HOÀN TOÀN không liên quan du lịch: toán học, lập trình code, y tế bệnh viện, chính trị, chứng khoán..."
| PHÂN BIỆT "ĐI" (động từ thường) vs "ĐI" (chỉ địa điểm du lịch): Câu hỏi có động từ như "học", "làm", "kiếm tiền", "chữa bệnh", "thi", "ôn bài" KẾT HỢP với "đi" → KHÔNG phải du lịch → isOffTopic: true.

Trả về duy nhất định dạng JSON:
{
  "isSensitive": boolean, // true nếu hỏi về tài chính cá nhân (số dư, lương, chi tiêu), thông tin bảo mật cá nhân (CMND, mật khẩu, địa chỉ nhà riêng)
  "isOffTopic": boolean, // true CHỈ KHI câu hỏi hoàn toàn ngoài phạm vi du lịch/văn hóa/lịch sử Việt Nam. KHÔNG được true khi đã có destination hoặc isItineraryRequest=true
  "isItineraryRequest": boolean, // true nếu có ý định lên lịch trình, đi chơi, đề xuất điểm đến du lịch
  "destination": string | null, // Địa danh hoặc địa điểm du lịch được nhắc đến, null nếu không có
  "days": number | null, // Số ngày du lịch, null nếu không có
  "budget": number | null // Ngân sách (triệu VNĐ), null nếu không có
}

VÍ DỤ:
- "lập lịch 2 ngày 3 triệu" → {isOffTopic:false, isItineraryRequest:true, days:2, budget:3}
- "đi tuyên quang" → {isOffTopic:false, isItineraryRequest:true, destination:"Tuyên Quang"}
- "giải phương trình toán" → {isOffTopic:true, isItineraryRequest:false}"
|- "tôi muốn đi học" → {isOffTopic:true, isItineraryRequest:false}
|- "tôi muốn đi Đà Lạt" → {isOffTopic:false, isItineraryRequest:true, destination:"Đà Lạt"}
- "Quốc Tử Giám ở đâu" → {isOffTopic:false, isItineraryRequest:false, destination:"Quốc Tử Giám"}`
            },
            { role: 'user', content: `Tin nhắn: "${message}"` }
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.1,
          response_format: { type: 'json_object' }
        }, false);

        const semanticRaw = routeCompletion.choices[0]?.message?.content | '{}';
        const parsed = JSON.parse(semanticRaw);
        // Gán lại biến semanticIntent đã khai báo ở dòng 315 (KHÔNG dùng const để tránh SyntaxError)
        semanticIntent = { ...semanticIntent, ...parsed };
        console.log(`🧠 [Semantic Intent Parser] Analyzed:`, semanticIntent);

        // -------------------------------------------------
        // Đặt các biến sẽ dùng ở các khối sau để tránh ReferenceError
        // specificLandmark sẽ được xác định sau khi duyệt landmarkToProvinceEarly
        let specificLandmark = null;
        // Các từ khóa dùng để phát hiện câu hỏi ngữ cảnh (bây giờ, hôm nay, ...)
        const contextKeywords = ['đây','bây giờ','tối nay','hiện tại','này','mình','tôi','em'];
        // -------------------------------------------------

        // Đã gỡ bỏ chốt chặn isSensitive và isOffTopic cứng nhắc ở đây
        // AI LLaMA chính đã có system prompt từ chối khéo các câu hỏi nhạy cảm hoặc ngoài lề, nhưng sẽ hiểu được ngữ cảnh các câu nối tiếp như "trước hay sau sáp nhập".

        // Bỏ chặn off-topic cứng nhắc ở đây để AI tự nhiên hơn trong hội thoại nhiều lượt.
        // AI LLaMA chính đã có system prompt từ chối khéo các câu hỏi ngoài lề, nhưng sẽ hiểu được ngữ cảnh các câu nối tiếp như "nói rõ vào".
      } catch (err) {
        console.error("⚠️ Error in Semantic Intent Parser:", err.message);
      }
    }

    // --- QUICK RESPONSE ---
    const lowerMsg = message.toLowerCase().trim().replace(/[?.,!]$/, "");
    const quickGreetings = ['alo', 'chào', 'hi', 'hello', 'ơi', 'ê', 'hey', 'ê hả', 'xin chào', 'hi soul', 'hello wander', 'annyeonghaseyo', 'bonjour', 'konnichiwa', 'ni hao'];

    if (quickGreetings.includes(lowerMsg)) {
      // Chỉ sử dụng Quick Response tiếng Việt nếu:
      // 1. targetLang là 'vi'
      // 2. targetLang là 'auto' VÀ từ khóa chào hỏi là thuần Việt
      const isVietnameseIntent = (targetLang === 'vi') | (targetLang === 'auto' && ['alo', 'chào', 'ơi', 'ê', 'ê hả', 'xin chào'].includes(lowerMsg));

      // Nếu là ngôn ngữ khác (en, jp, kr, fr), BẮT BUỘC bỏ qua Quick Response để AI tự trả lời đúng thứ tiếng
      if (isVietnameseIntent) {
        const answer = "Chào bạn! Mình là Trợ lý du lịch WanderViet AI đây. Bạn cần mình tư vấn địa điểm nào hay có thắc mắc gì về chuyến đi không?";
        
        // Ghi lại lịch sử ngay cả với Quick Response để session không bị "rỗng" trong History
        if (chatbotDb.readyState === 1) {
          if (!currentSessionId) currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          
          // Tạo title từ tin nhắn chào hỏi
          let title = message.split(' ').slice(0, 5).join(' ');
          
          await new Conversation({ userId: sessionKey, sessionId: currentSessionId, title: title, role: 'user', text: message }).save();
          await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'model', text: answer }).save();
        }

        return res.json({
          success: true,
          answer: answer,
          sessionId: currentSessionId,
          source: 'quick-response'
        });
      }
    }

    // =============================================================
    // 🚫 Fix 1: CHẶN NGAY nếu Semantic Intent đánh dấu OFF-TOPIC
    // Từ chối TẠI SERVER — không tạo discovery cards, không gọi Groq
    // =============================================================
    if (semanticIntent.isOffTopic) {
      const refusalMsg = "Dù rất muốn chia sẻ cùng bạn nhưng mình là Wander-Soul - Trợ lý chuyên trách về du lịch và khám phá Việt Nam của WanderViet AI mất rồi nè! Căn bếp nhỏ của mình hiện tại chỉ có sẵn 'bí kíp' về các cung đường đẹp, món ăn ngon, lịch sử địa danh và lịch trình du lịch siêu chill thôi. Bạn có muốn mình gợi ý một điểm đến thú vị hay lên kế hoạch cho chuyến đi sắp tới của bạn không?";

      if (chatbotDb.readyState === 1) {
        if (!currentSessionId) currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const title = message.split(' ').slice(0, 5).join(' ');
        await new Conversation({ userId: sessionKey, sessionId: currentSessionId, title: title, role: 'user', text: message }).save();
        await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'model', text: refusalMsg }).save();
      }

      console.log(`🚫 [Off-Topic Guard] Rejected at server level — no discovery cards generated.`);
      return res.json({
        success: true,
        answer: refusalMsg,
        sessionId: currentSessionId,
        source: 'off-topic-guard'
        // KHÔNG có discoveryPlaces, suggestedTours, proposal → chặn tuyệt đối
      });
    }
    // =============================================================

    // 1. Phân tích Lịch sử hội thoại từ SERVER theo Session
    let chatHistory = [];

    if (chatbotDb.readyState === 1 && currentSessionId) {
      try {
        const recentLogs = await Conversation.find({ sessionId: currentSessionId })
          .sort({ timestamp: -1 })
          .limit(10);

        if (recentLogs.length > 0) {
          chatHistory = recentLogs.reverse().map(log => ({
            role: log.role === 'user' ? 'user' : 'assistant',
            content: log.text
          }));
        }
      } catch (err) {
        console.warn("⚠️ Lỗi truy xuất lịch sử:", err.message);
      }
    }

    // 2. Xử lý ngữ cảnh hành trình & vị trí
    let tripContext = "Khách đang khám phá tự do.";
    if (itinerary && itinerary.length > 0) {
      const stops = itinerary.map(s => s.name | s).join(' -> ');
      tripContext = `Khách đang đi theo chuyến: "${activeTrip | 'Hành trình thông minh'}". Lộ trình dự kiến: ${stops}.`;
    }

    let locationContext = "Chưa xác định rõ vị trí GPS.";
    if (coords && coords.lat && coords.lng) {
      const nearest = cachedPlaces.find(p => {
        const d = Math.sqrt(Math.pow(p.lat - coords.lat, 2) + Math.pow(p.lng - coords.lng, 2));
        return d < 0.5;
      });
      if (nearest) locationContext = `Vị trí hiện tại: ${nearest.name} (${nearest.region}). Đặc tả: ${nearest.text}.`;
    }

    // --- START SMART CACHE (TRÍ NHỚ PHẢN XẠ) ---
    // Kiểm tra câu hỏi có trong Database chưa để tiết kiệm API (Chỉ áp dụng cho tiếng Việt hoặc Auto)
    let searchResult = null; // Lưu kết quả nếu phải đi "tìm kiếm"

    if (!placeContext && chatbotDb.readyState === 1 && message.length > 2 && (targetLang === 'vi' | targetLang === 'auto')) {
      const timeSensitiveKeywords = ['thứ mấy', 'ngày nào', 'mấy giờ', 'hôm nay', 'bây giờ', 'thu may', 'ngay nao', 'may gio', 'hom nay', 'bay gio'];
      const isTimeSensitive = timeSensitiveKeywords.some(k => lowerMsg.includes(k));
      
      try {
        // A. Ưu tiên tìm trong bảng Knowledge (Kiến thức Admin soạn hoặc AI đã học)
        // Dùng khớp chính xác (strict match) thay vì regex để tránh "trượt" kiến thức
        const knowledgeMatch = await Knowledge.findOne({
          $or: [
            { question: lowerMsg },
            { question: message.trim() }
          ]
        });

        if (knowledgeMatch && !isTimeSensitive) {
          console.log("➡️ [SmartCache] Khớp kiến thức:", knowledgeMatch.question);
          
          if (chatbotDb.readyState === 1) {
            if (!currentSessionId) currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const title = message.split(' ').slice(0, 5).join(' ');
            await new Conversation({ userId: sessionKey, sessionId: currentSessionId, title: title, role: 'user', text: message }).save();
            await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'model', text: knowledgeMatch.answer }).save();
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

        // B. WIKIPEDIA WEB SEARCH & SMART CACHE (Tải TOÀN BỘ thông tin thật và lưu DB)
        // Determine destination to search. Initially use semantic intent; later fallback mechanisms will refine.
        let destToSearch = semanticIntent.destination;
        
        // Cứu cánh cho câu hỏi nối tiếp (VD: "bây giờ cơ mà"): Lục lại lịch sử chat để tìm địa danh đang nói đến
        if (!destToSearch && chatHistory.length > 0) {
            const allText = chatHistory.map(h => h.content).join(' ').toLowerCase();
            const knownRegions = [...new Set(cachedPlaces.map(p => p.region))].concat(['Tuyên Quang', 'Hà Giang', 'Hà Tuyên', 'Bắc Giang', 'Phú Thọ', 'Yên Bái', 'Vĩnh Phúc', 'Thái Nguyên', 'Bắc Kạn']);
            
            for (const region of knownRegions) {
                if (region && allText.includes(region.toLowerCase())) {
                    destToSearch = region;
                    break;
                }
            }
        }
        if (destToSearch && destToSearch.length > 2 && !searchResult) {
            try {
                const wikiKey = `WIKI_${destToSearch.toLowerCase()}`;
                const cachedWiki = await Knowledge.findOne({ question: wikiKey });
                
                if (cachedWiki) {
                    searchResult = cachedWiki.answer;
                    if (searchResult && searchResult.length > 3000) {
                        searchResult = searchResult.substring(0, 3000) + "...";
                    }
                    console.log(`🌐 [Wiki Cache] Đã lấy kho dữ liệu khổng lồ từ Database cho: ${destToSearch}`);
                } else {
                    const https = require('https');
                    const wikiUrl = `https://vi.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&explaintext&redirects=1&titles=${encodeURIComponent(destToSearch)}`;
                    const options = {
                        timeout: 5000,
                        headers: {
                            'User-Agent': 'WanderVietBot/1.0 (wanderviet@example.com)'
                        }
                    };
                    
                    searchResult = await new Promise((resolve) => {
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
                                        // to ensure the LLM reads the "Tourism" and "Culture" sections of provinces.
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
                    
                    if (searchResult) {
                        // searchResult now an object { snippet, full }
                        console.log(`🌐 [Wiki Fact-Check] Đã tải thông tin cho: ${destToSearch}`);
                        // Store full article in DB for future use
                        Knowledge.create({
                            question: wikiKey,
                            answer: searchResult.full, // store the full article
                            userName: 'AI System',
                            source: 'ai_learned'
                        }).catch(err => console.error("Lỗi lưu wiki vào DB:", err));
                        // Use snippet for immediate response
                        searchResult = searchResult.snippet;
                    }
                }
            } catch (e) {
                console.error("Wiki fetch error:", e.message);
            }
        }

        // If user explicitly asks for full detail, return the stored full article
        if ((lowerMsg.includes('chi tiết') | lowerMsg.includes('toàn bộ')) && destToSearch) {
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

        if (!searchResult && !isContextSensitive && !isItinEarly && !isTimeSensitive && lowerMsg.length > 10) {
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
    }
    // --- END SMART CACHE ---

    // --- START SYSTEM PROMPT CONSTRUCTION ---
    let systemPrompt = "";
    const userRole = role | (req.user ? req.user.role : 'user');

    if (placeContext) {
      // CHẾ ĐỘ CHUYÊN GIA DỊCH VỤ CỐ ĐỊNH (FIXED CONTEXT)
      systemPrompt = `BẠN LÀ NHÂN VIÊN CHUYÊN TRÁCH CỦA DỊCH VỤ: "${placeContext.name}".
DỮ LIỆU CỐ ĐỊNH (DUY NHẤT):
- Tên: ${placeContext.name}
- Loại: ${placeContext.kind | placeContext.businessCategory}
- Mô tả: ${placeContext.description | placeContext.text}
- Đặc điểm: ${Array.isArray(placeContext.highlights) ? placeContext.highlights.join(', ') : 'Chưa có'}
- Tiện ích: ${Array.isArray(placeContext.amenities) ? placeContext.amenities.join(', ') : 'Chưa có'}
- Giá: ${placeContext.price | placeContext.priceFrom | 'Liên hệ'} VNĐ
- Giờ mở cửa: ${placeContext.openTime} - ${placeContext.closeTime}
- FAQ: ${Array.isArray(placeContext.faqs) ? placeContext.faqs.map(f => `Q: ${f.question} -> A: ${f.answer}`).join(' | ') : 'Chưa có'}

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
      systemPrompt = `BẠN LÀ: WANDER-SOUL - Trợ lý du lịch thông thái, am hiểu sâu sắc và tinh tế bậc nhất của hệ thống WanderViet AI.
=== 1. PHONG CÁCH & DIỆN MẠO CHUYÊN GIA ===
- Phong cách: Thân thiện, hiếu khách, nhiệt tình nhưng cực kỳ chuyên nghiệp và đáng tin cậy. Thể hiện đẳng cấp của một cố vấn du lịch thực thụ.
- Cách xưng hô: Xưng "mình" hoặc "Wander-Soul", gọi khách là "bạn" (hoặc xưng hô linh hoạt, lịch sự theo ngữ cảnh hội thoại). Sử dụng tự nhiên các từ đệm như "nè", "nha", "nhé" để tạo cảm giác gần gũi.
- Trình bày: BẮT BUỘC sử dụng định dạng Markdown sang trọng (in đậm, gạch đầu dòng, danh sách, emoji sinh động, bảng biểu khi cần thiết). Không viết những khối văn bản dài dặc gây mỏi mắt. Chia đoạn rõ ràng, rành mạch.
=== 2. RANH GIỚI PHẠM VI NHIỆM VỤ (STRICT BOUNDARIES) ===
Bạn phải có ranh giới nhiệm vụ cực kỳ rõ ràng và nghiêm ngặt:
* NẰM TRONG PHẠM VI HỖ TRỢ (IN-SCOPE):
  - Địa điểm du lịch, danh lam thắng cảnh, điểm vui chơi giải trí trên khắp Việt Nam.
  - LỊCH SỬ & ĐỊA LÝ VIỆT NAM LIÊN QUAN ĐẾN ĐỊA DANH: Đây là cốt lõi của du lịch văn hóa. Khách hỏi về nguồn gốc lịch sử (Sự tích Hồ Gươm, Ải Chi Lăng, triều đại nhà Lê tại Lam Kinh...), địa hình, khí hậu, vị trí của bất kỳ địa phương nào tại Việt Nam đều NẰM TRONG phạm vi bạn phải trả lời thật sâu sắc, cuốn hút và chính xác.
  - Ẩm thực, đặc sản địa phương, nhà hàng, phong tục tập quán, lễ hội truyền thống Việt Nam.
  - Lập kế hoạch chuyến đi, thiết kế lịch trình cá nhân hóa, dự trù ngân sách, phương tiện di chuyển.
  - Hướng dẫn đặt tour, phòng khách sạn, thuê xe... có trên hệ thống WanderViet.
* NẰM NGOÀI PHẠM VI HỖ TRỢ (OUT-OF-SCOPE):
  - Các câu hỏi không liên quan đến du lịch, văn hóa, ẩm thực, lịch sử hay địa lý Việt Nam.
  - Ví dụ: "tôi muốn đi học", "con chó có màu gì", giải toán, viết code, tư vấn tài chính, y khoa, chính trị nhạy cảm...
  - NGUYÊN TẮC TỪ CHỐI KHÉO: Khi khách hỏi những câu này, tuyệt đối KHÔNG trả lời trực tiếp nội dung đó, không thô lỗ hay máy móc. Hãy từ chối khéo léo, duyên dáng và lập tức điều hướng khách quay lại chủ đề du lịch.
  * Mẫu câu từ chối chuẩn: "Dù rất muốn chia sẻ cùng bạn nhưng mình là Wander-Soul - Trợ lý chuyên trách về du lịch và khám phá Việt Nam của WanderViet AI mất rồi nè! Căn bếp nhỏ của mình hiện tại chỉ có sẵn 'bí kíp' về các cung đường đẹp, món ăn ngon, lịch sử địa danh và lịch trình du lịch siêu chill thôi. Bạn có muốn mình gợi ý một điểm đến thú vị hay lên kế hoạch cho chuyến đi sắp tới của bạn không?"
=== 3. HIỂU NGỮ CẢNH SÂU & CHỐNG SPAM TOUR BỪA BÃI (DEEP CONTEXT & ANTI-SPAM) ===
Bạn sở hữu trí tuệ cảm xúc cao, hiểu sâu sắc ngôn ngữ tự nhiên chứ không hoạt động dựa trên việc quét từ khóa thô sơ.
- Hiểu sâu toàn bộ câu và lịch sử chat (chatHistory): Đọc hiểu toàn bộ ý nghĩa câu nói của khách kết hợp lịch sử trò chuyện để nắm bắt tâm tư, hoàn cảnh của họ.
- Xử lý lỗi gõ nhanh/viết tắt/không dấu của khách: Khách hàng có thể nhắn tin rất nhanh dẫn đến sai chính tả hoặc viết tắt (VD: "lịch trìn hn", "tuyen qang 2n", "ksan hnoi", "đi chơi gi"). Hãy dùng năng lực suy luận ngữ cảnh để hiểu đúng ý họ muốn nói (ví dụ: "tuyen qang 2n" -> "Tuyên Quang 2 ngày") thay vì hỏi lại hoặc trả lời lạc đề.
- NGUYÊN TẮC CHỐNG SPAM TOUR/LỊCH TRÌNH:
  + Tán gẫu & Hỏi đáp kiến thức thuần túy: Khi khách chỉ chào hỏi, hỏi thăm sức khỏe, hoặc hỏi kiến thức lịch sử/địa lý thuần túy (VD: "Cầu Long Biên được xây năm nào?", "Hà Giang giáp những tỉnh nào?"), bạn CHỈ TRẢ LỜI CHÍNH XÁC kiến thức đó. Tuyệt đối KHÔNG tự ý chèn link giới thiệu tour du lịch hay lịch trình chi tiết vào lúc này vì sẽ gây cảm giác chèo kéo phiền phức.
  + Chỉ gợi ý khi có nhu cầu thực tế: Chỉ bắt đầu tư vấn dịch vụ, đề xuất tour hoặc thiết kế lịch trình khi khách chủ động yêu cầu (VD: "Lập cho mình lịch trình...", "Ở đây có tour nào không bạn?", "Gợi ý cho mình khách sạn đẹp ở Đà Lạt") hoặc khi câu chuyện tự nhiên dẫn dắt đến việc khách đang chuẩn bị đi du lịch và cần giải pháp cụ thể.
=== 4. QUY TRÌNH THIẾT KẾ LỊCH TRÌNH LINH HOẠT & CÁ NHÂN HÓA ===
Khi khách yêu cầu lập lịch trình, bạn phải thiết kế một cách linh hoạt, cá nhân hóa tối đa theo các thông số được cung cấp:
1. Địa điểm (Destination): Phải chính xác tuyệt đối về mặt địa lý thực tế ở Việt Nam. Tuyệt đối không râu ông nọ cắm cằm bà kia (CẤM lấy món ăn/địa danh Hà Nội gán vào Đà Nẵng).
2. Thời gian & Ngày tháng: Chia lịch trình theo từng ngày rõ ràng (Ngày 1, Ngày 2...), phân bổ hoạt động hợp lý theo buổi Sáng, Trưa, Chiều, Tối. Nhịp độ di chuyển phải phù hợp (thong thả hay năng động).
3. Ngân sách (Budget): Dự trù số tiền hợp lý cho chuyến đi theo phân khúc ngân sách khách yêu cầu (Tiết kiệm, Tầm trung, Sang trọng). Đưa ra các gợi ý chi phí thực tế (tiền ăn uống ước lượng, vé tham quan, tiền phòng).
4. Bạn đồng hành & Phong cách: Hỏi han hoặc nhận diện bạn đồng hành để tinh chỉnh hoạt động:
   - Đi với gia đình có người già/trẻ nhỏ -> Lịch trình thong thả, an toàn, ít di chuyển xa.
   - Đi với nhóm bạn trẻ -> Năng động, trải nghiệm phượt, check-in các điểm hot, ẩm thực đường phố.
   - Đi cặp đôi -> Lãng mạn, chill, cafe view đẹp, nghỉ dưỡng sang trọng.
=== 5. QUY TẮC PHỐI HỢP VỚI HỆ THỐNG WANDERVIET ===
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
      langRule = `BẮT BUỘC TRẢ LỜI BẰNG ${languageNames[req.body.lang] | 'Tiếng Việt'}.`;
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
    
    systemPrompt += `\n- NGỮ CẢNH VỊ TRÍ: ${locationContext}`;
    systemPrompt += `\n- VAI TRÒ NGƯỜI DÙNG: ${userRole} | TRANG: ${scope}`;
    
    systemPrompt += `\n\nCHỈ THỊ CUỐI CÙNG: Trả lời bằng ngôn ngữ của khách. Thân thiện, ngắn gọn, cực kỳ am hiểu về dữ liệu trên.`;

    // --- PHÁT HIỆN YÊU CẦU LẬP LỊCH TRÌNH (ITINERARY GENERATION) ---
    const itineraryKeywords = [
      'lên lịch', 'lập lịch', 'tạo lịch', 'lên kế hoạch', 'lịch trình', 'itinerary', 'hành trình cho', 'đặt lịch', 'thiết kế chuyến', 'tạo chuyến', 'lên plan', 'plan chuyến',
      'len lich', 'lap lich', 'tao lich', 'len ke hoach', 'lich trinh', 'hanh trinh cho', 'dat lich', 'thiet ke chuyen', 'tao chuyen', 'len plan', 'plan chuyen',
      'đổi lịch', 'đổi điểm', 'đổi địa điểm', 'tạo lại lịch', 'làm lại lịch', 'thay điểm',
      'doi lich', 'doi diem', 'doi dia diem', 'tao lai lich', 'lam lai lich', 'thay diem',
      'đi đâu', 'chơi gì', 'di dau', 'choi gi', 'muốn đi', 'muon di', 'cho mình đi', 'cho minh di'
    ];
    // Phát hiện thêm các câu đổi ý chung chung như "k thích đại điểm này đổi đi"
    let isModification = lowerMsg.includes('đổi') | lowerMsg.includes('doi') | lowerMsg.includes('k thích') | lowerMsg.includes('không thích') | lowerMsg.includes('khong thich');
    let isItineraryRequest = itineraryKeywords.some(k => lowerMsg.includes(k)) | 
                             (lowerMsg.includes('lịch') && lowerMsg.includes('trình')) |
                             (lowerMsg.includes('kế') && lowerMsg.includes('hoạch'));

    if (isModification && (lowerMsg.includes('điểm') | lowerMsg.includes('diem') | lowerMsg.includes('chỗ') | lowerMsg.includes('cho') | lowerMsg.includes('này') | lowerMsg.includes('nay'))) {
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
           if (lastMsg.role === 'assistant' && (lastMsg.content.toLowerCase().includes('lập lịch') | lastMsg.content.toLowerCase().includes('đi đâu') | lastMsg.content.toLowerCase().includes('bao lâu'))) {
               isConversationalFollowUp = true;
           }
        }
        
        const hasDetailedParams = semanticIntent.destination && (semanticIntent.days | semanticIntent.budget);

        // NẾU TỪ TRƯỚC ĐÃ TRUE (nhờ keyword) thì GIỮ NGUYÊN.
        isItineraryRequest = isItineraryRequest | hasExplicit | isConversationalFollowUp | hasDetailedParams;
        
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

    if ((hasTourKeyword | hasServiceKeyword) && !hasStrongItinKeyword) {
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
        let destMatch = message.match(/(?:ở|tại|đến|đi du lịch|đi chuyến|khám phá)\s+([A-ZÀ-Ỹa-zà-ỹ][a-zà-ỹ]+(?:\s[A-ZÀ-Ỹa-zà-ỹ][a-zà-ỹ]+)*)/i);
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

        let destination = semanticIntent.destination | (destMatch ? destMatch[1].trim() : null);
        
        // Loại bỏ các từ bị bắt nhầm
        if (destination) {
            const badDests = ['trình', 'kế hoạch', 'đi', 'đến', 'này', 'nhé', 'đó', 'đây', 'chơi', 'giúp', 'cho', 'nha', 'chuyến', 'với', 'điểm', 'diem', 'mấy', 'bao nhiêu', 'nhanh', 'nhanh nhất'];
            if (badDests.includes(destination.toLowerCase().trim()) | destination.trim().length < 3) {
                destination = null;
            }
        }
        
        const days = semanticIntent.days | (daysMatch ? parseInt(daysMatch[1]) : (isAutoGen ? 3 : null));
        const budget = semanticIntent.budget | (budgetMatch ? parseInt(budgetMatch[1]) : null);

        // Cứu cánh cho câu hỏi nối tiếp nếu không tìm thấy địa danh trực tiếp
        if (!destination && chatHistory.length > 0) {
            const allText = chatHistory.map(h => h.content).join(' ').toLowerCase();
            
            // Ưu tiên 1: Tìm landmark nổi tiếng cụ thể trong lịch sử (VD: quốc tử giám, hồ gươm...)
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
            for (const [kw, dest] of Object.entries(landmarkMap)) {
                if (allText.includes(kw)) {
                    destination = dest;
                    console.log(`[Itinerary Follow-up] Recovered destination from landmark in history: '${kw}' → '${dest}'`);
                    break;
                }
            }
            
            // Ưu tiên 2: Tìm tỉnh thành
            if (!destination) {
                const provinces = ['Hà Nội', 'Hồ Chí Minh', 'Sài Gòn', 'Đà Lạt', 'Đà Nẵng', 'Hội An', 'Nha Trang', 'Phú Quốc', 'Huế', 'Hạ Long', 'Sa Pa', 'Cần Thơ', 'Mũi Né', 'Phan Thiết', 'Tuyên Quang', 'Ninh Bình', 'Quy Nhơn', 'Bình Định', 'Vũng Tàu', 'Côn Đảo', 'Sóc Sơn', 'Điện Biên', 'Lào Cai'];
                for (const p of provinces) {
                    if (allText.includes(p.toLowerCase())) {
                        destination = p;
                        break;
                    }
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
            const isValidProvince = validProvinces.some(p => destLower.includes(p.toLowerCase()) | p.toLowerCase().includes(destLower));
            const isValidLandmark = knownLandmarks.some(lm => destLower.includes(lm) | lm.includes(destLower));
            
            if (!isValidProvince && !isValidLandmark) {
                // Loại bỏ các từ bị bắt nhầm
                const badWords = ['học', 'làm', 'kiếm tiền', 'chữa bệnh', 'thi', 'ôn bài', 'trình', 'kế hoạch', 'chơi', 'đi', 'đến', 'mấy', 'bao nhiêu', 'nhanh'];
                const hasBadWord = badWords.some(bw => destLower.includes(bw));
                
                if (hasBadWord | destination.trim().length < 3) {
                    const askDestMsg = "Mình cần biết bạn muốn đi đâu thật sự nè! Bạn cho mình biết tên tỉnh thành hoặc địa điểm du lịch cụ thể nhé (ví dụ: Đà Lạt, Hội An, Văn Miếu...). Mình sẽ lập lịch trình cực xịn cho bạn! 😊";
                    if (chatbotDb.readyState === 1) {
                        if (!currentSessionId) currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'user', text: message }).save();
                        await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'model', text: askDestMsg }).save();
                    }
                    return res.json({
                        success: true,
                        answer: askDestMsg,
                        sessionId: currentSessionId,
                        source: 'invalid-destination-guard'
                    });
                }
            }
        }
        // =============================================================

        if (!destination) {
            const askDestMsg = "Tuyệt vời! Bạn muốn lập lịch trình đi đâu, trong khoảng mấy ngày và ngân sách dự kiến là bao nhiêu nhỉ? (Ví dụ: 'Tuyên Quang 2 ngày 3 triệu')";
            
            if (chatbotDb.readyState === 1) {
                if (!currentSessionId) currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'user', text: message }).save();
                await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'model', text: askDestMsg }).save();
            }

            return res.json({
                success: true,
                answer: askDestMsg,
                sessionId: currentSessionId,
                source: 'itinerary-question'
            });
        }

        const finalDest = destination;
        const finalDays = days | 3;
        const finalBudget = budget | 5;
        const companion = semanticIntent.companion | "Bạn bè";
        const interests = semanticIntent.interests | "";

        console.log(`✈️ [Itinerary] Creating 3 Parallel Real Detailed Plans for: ${finalDest}, ${finalDays} ngày, ${finalBudget}tr...`);

        const styles = [
            { title: "Khám phá & Bản sắc 🏛️", vibe: "Khám phá văn hóa, di tích lịch sử đặc trưng, ẩm thực địa phương, nhịp độ vừa phải", pace: "Vừa phải", transport: "Xe máy/Taxi", accommodation: "Homestay bản địa hoặc khách sạn trung tâm" },
            { title: "Nghỉ dưỡng & Cafe Chill ☕", vibe: "Thư giãn nhẹ nhàng, thưởng thức cafe check-in view đẹp, nhịp độ thong thả", pace: "Thong thả", transport: "Xe máy/Taxi", accommodation: "Resort/Homestay boutique xinh xắn" },
            { title: "Năng động & Trải nghiệm 🎒", vibe: "Các điểm check-in chụp ảnh hot nhất, trekking, hoạt động ngoài trời, nhịp độ nhanh", pace: "Nhanh", transport: "Xe máy phượt/Ô tô", accommodation: "Khách sạn phong cách trẻ trung" }
        ];

        const generatePlanForStyle = async (dest, daysVal, budgetVal, styleObj) => {
            const prompt = `Bạn là SIÊU KIẾN TRÚC SƯ LỊCH TRÌNH của WanderViet AI. Hãy tạo một lịch trình du lịch TỐI ƯU BỞI AI cho điểm đến ${dest} trong ${daysVal} ngày.
            
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
                    { role: 'system', content: 'Bạn là chuyên gia thiết kế lịch trình thực địa. Hãy trả về CHỈ JSON hợp lệ.' },
                    { role: 'user', content: prompt }
                ],
                model: 'llama-3.1-8b-instant',
                temperature: 0.7,
                response_format: { type: 'json_object' }
            }, false);

            const raw = comp.choices[0]?.message?.content | '{}';
            return JSON.parse(raw);
        };

        const plans = await Promise.all(styles.map(style => 
            generatePlanForStyle(finalDest, finalDays, finalBudget, style)
                .catch(err => {
                    console.error("Lỗi tạo plan cho style:", style.title, err);
                    return null;
                })
        ));

        // Lấy thông tin user đăng nhập
        let userName = 'Khách vãng lai';
        let userEmail = '';
        if (req.user) {
          const userDoc = await User.findById(req.user.id);
          if (userDoc) {
            userName = userDoc.displayName | userDoc.name | 'Thành viên WanderViet AI';
            userEmail = userDoc.email | '';
          }
        }

        const savedProposals = [];
        for (let i = 0; i < plans.length; i++) {
          const plan = plans[i];
          if (!plan | !plan.itinerary) continue;
          
          const styleObj = styles[i];
          
          const itinerary = new Itinerary({
            userId: req.user ? req.user.id : null,
            destination: String(finalDest),
            days: Number(finalDays),
            budget: `${finalBudget} triệu VNĐ`,
            companion: String(companion),
            interests: String(interests | styleObj.vibe),
            planJson: plan,
            userName,
            userEmail,
            isDraft: true // Nháp
          });
          
          const saved = await itinerary.save();
          savedProposals.push({
            _id: saved._id.toString(),
            title: styleObj.title,
            destination: finalDest,
            days: finalDays,
            budget: `${finalBudget} triệu VNĐ`,
            style: styleObj.title,
            description: plan.tripSummary | styleObj.vibe
          });
        }

        if (savedProposals.length > 0) {
          const summaryMsg = `Dựa trên sở thích của bạn, Trợ lý WanderViet AI đã thiết kế riêng **${savedProposals.length} phương án lịch trình thực tế** siêu chất lượng tại **${finalDest}**.

Hãy bấm vào phương án bạn thích bên dưới để chuyển trực tiếp đến **Travel Planner AI** xem chi tiết bản đồ di chuyển, gợi ý phòng, dự trù ngân sách và video review nhé! 👇\n[ITIN_PROPOSALS:${JSON.stringify(savedProposals)}]`;

          if (chatbotDb.readyState === 1) {
            if (!currentSessionId) currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'user', text: message }).save();
            await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'model', text: summaryMsg, hasProposal: true }).save();
          }

          return res.json({
            success: true,
            answer: summaryMsg,
            sessionId: currentSessionId,
            proposals: savedProposals,
            source: 'itinerary-proposals-generator-v2'
          });
        }
      } catch (itinErr) {
        console.error('Lỗi generate lịch trình premium:', itinErr.message);
      }
    }

    try {
      // Ép model tuân thủ ngôn ngữ bằng cách nhúng thẳng lệnh vào câu hỏi cuối cùng
      let finalUserMessage = message;
      if (targetLang !== 'auto') {
        const langName = languageNames[targetLang] | 'Tiếng Việt';
        finalUserMessage = `${message}\n\n[SYSTEM INSTRUCTION: You MUST reply in ${langName}. Do NOT use any other language.]`;
      } else {
        finalUserMessage = `${message}\n\n[SYSTEM INSTRUCTION: Detect the language of my message and reply in that same language.]`;
      }

      // 4. MÔ HÌNH SUY LUẬN CHÍNH (MAIN REASONING MODEL) - Sử dụng Model mạnh nhất (70B)
      const isBiz = userRole === 'business';
      
        let completion;
        try {
          completion = await createGroqChatCompletion({
            messages: [
              { role: "system", content: systemPrompt },
              ...chatHistory,
              { role: "user", content: finalUserMessage }
            ],
            model: "llama-3.3-70b-versatile", // Luôn dùng model mạnh để suy luận, kiến trúc hiện đại
            temperature: 0.3,
            max_tokens: 1000
          }, isBiz);
        } catch (err70b) {
          console.warn("⚠️ [Groq Fallback] 70B Model failed/rate-limited, falling back to 8B Model:", err70b.message);
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

        console.log("[DEBUG H1] Groq raw completion content:", JSON.stringify(completion.choices[0]?.message?.content));
        console.log("[DEBUG H1] Type of raw content:", typeof completion.choices[0]?.message?.content);

        let aiAnswer = completion.choices[0]?.message?.content || "Mình chưa nghe rõ, bạn nói lại nhé!";

        console.log("[DEBUG H2] aiAnswer after assignment:", aiAnswer, "| type:", typeof aiAnswer, "| length:", typeof aiAnswer === 'string' ? aiAnswer.length : 'N/A');

      // 4.5. MÔ HÌNH KIỂM DUYỆT (VERIFIER AI) - Đã gỡ bỏ để tăng tốc độ phản hồi và chống lỗi dịch tiếng Trung ngẫu nhiên.
      // Thay vào đó, model 70B với temperature 0.3 đã đủ độ tin cậy để xử lý ngữ cảnh 12,000 ký tự.

      // 5. LƯU TRÍ NHỚ (Ghi vào DB Server theo Session)
      if (chatbotDb.readyState === 1 && aiAnswer) {
        try {
          // Nếu chưa có sessionId (phiên mới), tạo một cái
          if (!currentSessionId) {
            currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            // console.log("🆕 Generated new sessionId:", currentSessionId);
          }

          // Lấy tiêu đề từ tin nhắn đầu tiên (Xử lý thông minh hơn)
          let title = undefined;
          const firstMsgCount = await Conversation.countDocuments({ sessionId: currentSessionId });
          if (firstMsgCount === 0) {
            // Tự tạo tên ngắn gọn từ câu hỏi
            let cleanMsg = message.replace(/[?.,!]/g, '').trim();
            title = cleanMsg.split(' ').slice(0, 6).join(' ');
            if (cleanMsg.split(' ').length > 6) title += '...';
            if (!title) title = 'Hội thoại mới';
            // console.log("📝 Set session title:", title);
          }


          await new Conversation({
            userId: sessionKey,
            sessionId: currentSessionId,
            title: title, // Chỉ lưu title nếu đây là tin nhắn đầu tiên
            role: 'user',
            text: message
          }).save();

          const answerDoc = await new Conversation({
            userId: sessionKey,
            sessionId: currentSessionId,
            role: 'model',
            text: aiAnswer
          }).save();
          
          res.locals.messageId = answerDoc._id; // Store to return later
        } catch (saveErr) {
          console.error("Lỗi lưu trí nhớ:", saveErr.message);
        }
      } else if (chatbotDb.readyState !== 1) {
        console.warn("⚠️ Chatbot DB not ready (readyState: " + chatbotDb.readyState + "). Message not saved.");
      }

      const finalMeta = await generateResponseMetadata(message, aiAnswer, locationContext, isItineraryRequest);

      res.json({
        success: true,
        answer: aiAnswer,
        sessionId: currentSessionId,
        messageId: res.locals.messageId | null,
        proposal: finalMeta.proposal,
        discoveryPlaces: finalMeta.discoveryPlaces,
        suggestedTours: finalMeta.suggestedTours,
        source: 'wander-soul-gen3-ultimate'
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
      res.status(500).json({ success: false, answer: "Bộ não AI siêu tốc đang bảo trì, vui lòng thử lại sau!" });
    }
  } catch (error) {
    console.error('Critical Chat Error:', error.message);
    res.status(500).json({ success: false, answer: 'Lỗi hệ thống.' });
  }
});

// Lấy danh sách các phiên chat của người dùng
router.get('/sessions', optionalAuth, async (req, res) => {
  try {
    const sessionKey = req.user ? req.user.id : (req.query.deviceId | 'anonymous_guest');
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

      if (!displayTitle | displayTitle.trim() === 'Hội thoại mới' | displayTitle === 'null' | displayTitle === 'undefined') {
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
    const sessionKey = req.user ? req.user.id : (req.query.deviceId | 'anonymous_guest');

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
    if (!messageId | !['up', 'down', 'none'].includes(feedback)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ.' });
    }

    const sessionKey = req.user ? req.user.id : (req.query.deviceId | 'anonymous_guest');
    
    // Cập nhật phản hồi vào Conversation
    const updated = await Conversation.findOneAndUpdate(
      { _id: messageId, userId: sessionKey },
      { $set: { feedback, feedbackReason: reason | '' } },
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
