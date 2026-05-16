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

// Khởi tạo Groq (Bộ não AI siêu tốc)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// Khởi tạo Groq Business riêng (Không bị dính limit với user thường)
const groqBusiness = new Groq({ apiKey: process.env.GROQ_API_KEY_BUSINESS || process.env.GROQ_API_KEY });

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

// --- HELPER: GENERATE RESPONSE METADATA (PROPOSALS, DISCOVERY, TOURS) ---
async function generateResponseMetadata(message, aiAnswer, locationContext) {
  let proposal = null;
  let discoveryPlaces = null;
  let suggestedTours = null;

  const lowerAnswer = aiAnswer.toLowerCase();
  const lowerUserMsg = message.toLowerCase();
  const weatherKeywords = ['thời tiết', 'mát', 'đẹp trời', 'nắng', 'đi chơi', 'thoi tiet', 'dep troi', 'di choi'];
  const isWeatherContext = weatherKeywords.some(k => lowerUserMsg.includes(k) || lowerAnswer.includes(k));

  // A. Trích xuất hoặc Tự tạo Proposal (Lịch trình)
  if (lowerAnswer.includes('hành trình') || lowerAnswer.includes('chuyến đi') || lowerAnswer.includes('gợi ý') || isWeatherContext) {
      const destinationMatch = aiAnswer.match(/(tại|đến|ở|đi) ([A-ZÀ-Ỹ][a-zà-ỹ]+(\s[A-ZÀ-Ỹ][a-zà-ỹ]+)*)/);
      const daysMatch = aiAnswer.match(/(\d+) ngày/);
      
      if (destinationMatch || daysMatch) {
          proposal = {
              destination: destinationMatch ? destinationMatch[2] : (locationContext || "vùng lân cận"),
              days: daysMatch ? parseInt(daysMatch[1]) : 1,
              budget: lowerAnswer.includes('triệu') ? "3 đến 7 triệu VNĐ" : "Dưới 1 triệu VNĐ",
              style: isWeatherContext ? "Dạo phố & Ngắm cảnh" : "Khám phá",
              description: isWeatherContext ? "Trời đẹp thế này, làm một chuyến dạo quanh thành phố thì tuyệt vời!" : "Hành trình khám phá đầy hứa hẹn dành cho bạn."
          };
      } else if (isWeatherContext) {
          proposal = {
              destination: locationContext || "vùng lân cận",
              days: 1,
              budget: "Dưới 1 triệu VNĐ",
              style: "Dạo phố & Ngắm cảnh",
              description: "Trời đẹp thế này, làm một chuyến dạo quanh thành phố thì tuyệt vời!",
              title: "Chuyến đi ngẫu hứng ngày đẹp trời"
          };
      }
  }

  // B. Trích xuất Discovery (Địa điểm gợi ý)
  if (lowerAnswer.includes('địa điểm') || lowerAnswer.includes('quán') || lowerAnswer.includes('nơi') || lowerAnswer.includes('khám phá') || lowerAnswer.includes('gợi ý') || isWeatherContext) {
      discoveryPlaces = cachedPlaces
        .filter(p => lowerAnswer.includes(p.name.toLowerCase()) || Math.random() > 0.95)
        .slice(0, 5);
      
      if (discoveryPlaces.length === 0) {
          discoveryPlaces = cachedPlaces.sort(() => 0.5 - Math.random()).slice(0, 5);
      }
  }

  // C. Tìm kiếm Tour có sẵn trong Database (Feature 24)
  try {
      const tourKeywords = ['tour', 'gói', 'du lịch', 'trọn gói', 'goi', 'du lich', 'tron goi'];
      const wantsTour = tourKeywords.some(k => lowerUserMsg.includes(k)) || lowerAnswer.includes('tour');
      
      if (wantsTour || proposal) {
          // Cố gắng tìm địa danh trong tin nhắn hoặc câu trả lời nếu proposal.destination không có
          let searchDest = proposal ? proposal.destination : "";
          
          if (!searchDest) {
              // Tìm từ viết hoa trong tin nhắn người dùng (địa danh thường viết hoa)
              const userCaps = message.match(/[A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s[A-ZÀ-Ỹ][a-zà-ỹ]+)*/g);
              if (userCaps && userCaps.length > 0) {
                  searchDest = userCaps[0];
              }
          }
          
          if (!searchDest) searchDest = locationContext || "";

          let query = { isTour: true, isDeleted: { $ne: true }, status: 'approved' };
          
          if (searchDest && searchDest.length > 2) {
              query.$or = [
                  { name: new RegExp(searchDest, 'i') },
                  { region: new RegExp(searchDest, 'i') },
                  { text: new RegExp(searchDest, 'i') }
              ];
          }

          suggestedTours = await Place.find(query).limit(3).lean();
          
          // Nếu không tìm thấy tour đúng địa điểm, lấy tour nổi bật ngẫu nhiên
          if (!suggestedTours || suggestedTours.length === 0) {
              suggestedTours = await Place.find({ isTour: true, isDeleted: { $ne: true }, status: 'approved' }).sort({ favoritesCount: -1 }).limit(3).lean();
          }
      }
  } catch (tourErr) {
      console.error("Error fetching suggested tours:", tourErr);
  }

  console.log(`[Metadata] Suggested Tours count: ${suggestedTours ? suggestedTours.length : 0}`);
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
    const sessionKey = req.user ? req.user.id : (deviceId || 'anonymous_guest');

    // --- QUICK RESPONSE ---
    const targetLang = req.body.lang || 'auto';
    const lowerMsg = message.toLowerCase().trim().replace(/[?.,!]$/, "");
    const quickGreetings = ['alo', 'chào', 'hi', 'hello', 'ơi', 'ê', 'hey', 'ê hả', 'xin chào', 'hi soul', 'hello wander', 'annyeonghaseyo', 'bonjour', 'konnichiwa', 'ni hao'];

    if (quickGreetings.includes(lowerMsg)) {
      // Chỉ sử dụng Quick Response tiếng Việt nếu:
      // 1. targetLang là 'vi'
      // 2. targetLang là 'auto' VÀ từ khóa chào hỏi là thuần Việt
      const isVietnameseIntent = (targetLang === 'vi') || (targetLang === 'auto' && ['alo', 'chào', 'ơi', 'ê', 'ê hả', 'xin chào'].includes(lowerMsg));

      // Nếu là ngôn ngữ khác (en, jp, kr, fr), BẮT BUỘC bỏ qua Quick Response để AI tự trả lời đúng thứ tiếng
      if (isVietnameseIntent) {
        const answer = "Chào bạn! Mình là Trợ lý du lịch WanderViệt đây. Bạn cần mình tư vấn địa điểm nào hay có thắc mắc gì về chuyến đi không?";
        
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

    // --- START SMART CACHE (TRÍ NHỚ PHẢN XẠ) ---
    // Kiểm tra câu hỏi có trong Database chưa để tiết kiệm API (Chỉ áp dụng cho tiếng Việt hoặc Auto)
    let searchResult = null; // Lưu kết quả nếu phải đi "tìm kiếm"

    if (!placeContext && chatbotDb.readyState === 1 && message.length > 2 && (targetLang === 'vi' || targetLang === 'auto')) {
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

          const meta = await generateResponseMetadata(message, knowledgeMatch.answer, locationContext);
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

        // B. PHÁT HIỆN KIẾN THỨC MỚI (DISCOVERY MODE)
        // Nếu câu hỏi về một địa điểm hoặc thông tin du lịch cụ thể mà cache không có
        const discoveryKeywords = ['ở đâu', 'có gì hay', 'giá vé', 'là gì', 'mới có', 'thông tin về'];
        const isDiscoveryIntent = discoveryKeywords.some(k => lowerMsg.includes(k));

        if (isDiscoveryIntent) {
            // console.log("🔍 [Discovery] AI đang 'đi học' kiến thức mới...");
            // Giả lập Web Search: Gọi AI để lấy thông tin khách quan trước khi tổng hợp
            const researchCompletion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: "Bạn là một công cụ tra cứu thông tin du lịch. Hãy cung cấp 3-5 thông tin cốt lõi (vị trí, đặc điểm, giá vé/thời gian) về chủ đề sau. Nếu không biết, hãy nói 'KHÔNG_CÓ_DỮ_LIỆU'." },
                    { role: "user", content: message }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.3
            });
            const researchData = researchCompletion.choices[0]?.message?.content;
            
            if (researchData && researchData !== 'KHÔNG_CÓ_DỮ_LIỆU') {
                searchResult = researchData;
                // console.log("📝 [Discovery] Đã học được thông tin mới.");
                
                // TỰ ĐỘNG LƯU VÀO BỘ NÃO (ASYNCHRONOUS)
                // Chúng ta không đợi lưu xong để trả lời khách nhanh nhất
                Knowledge.create({
                    question: lowerMsg,
                    answer: "Kiến thức tự học: " + researchData,
                    userName: 'AI Discovery',
                    source: 'ai_learned'
                }).catch(err => console.error("Lỗi lưu kiến thức mới:", err));
            }
        }

        // C. Tìm trong lịch sử hội thoại toàn cầu (Global Conversation Cache)
        const contextKeywords = ['đây', 'bây giờ', 'tối nay', 'hiện tại', 'này', 'mình', 'tôi', 'em'];
        const isContextSensitive = contextKeywords.some(k => lowerMsg.includes(k));

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

              const meta = await generateResponseMetadata(message, prevAnswer.text, locationContext);
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
        console.error("⚠️ SmartCache Error:", cacheErr.message);
      }
    }
    // --- END SMART CACHE ---

    // --- START SYSTEM PROMPT CONSTRUCTION ---
    let systemPrompt = "";
    const userRole = role || (req.user ? req.user.role : 'user');
    const scope = req.body.scope || 'user_portal';

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
- FAQ: ${Array.isArray(placeContext.faqs) ? placeContext.faqs.map(f => `Q: ${f.question} -> A: ${f.answer}`).join(' | ') : 'Chưa có'}

QUY TẮC TỐI THƯỢNG (PHẢI TUÂN THỦ):
1. KHÔNG SỬ DỤNG KIẾN THỨC BÊN NGOÀI. Chỉ trả lời dựa trên DỮ LIỆU CỐ ĐỊNH ở trên.
2. Nếu khách hỏi "có món gì" hoặc "có gì hay", hãy trích xuất thông tin từ 'Mô tả' hoặc 'Đặc điểm'. 
3. TUYỆT ĐỐI KHÔNG bịa ra các món ăn (như Bánh mì, Phở...) nếu chúng không có trong DỮ LIỆU CỐ ĐỊNH.
4. Nếu không có thông tin trong dữ liệu, hãy nói: "Xin lỗi, hiện tại mình chỉ có thông tin về [Tên dịch vụ] như sau: [Tóm tắt dữ liệu]. Bạn vui lòng liên hệ trực tiếp để biết thêm chi tiết nhé!".
5. Cấm giới thiệu các địa điểm khác. Bạn chỉ trung thành với "${placeContext.name}".
`;
    } else if (scope === 'admin_portal') {
      systemPrompt = `BẠN LÀ: TRỰC QUAN QUẢN TRỊ - SENTINEL AI của WanderViệt. Phong cách: Chính xác.`;
    } else if (scope === 'business_portal') {
      systemPrompt = `BẠN LÀ: CỐ VẤN KINH DOANH WanderViệt. Hỗ trợ doanh nghiệp tối ưu vận hành.`;
    } else {
      systemPrompt = `BẠN LÀ: WANDER-SOUL - Trợ lý du lịch thông thái. Thân thiện, High EQ.`;
    }

    // --- REAL-TIME CONTEXT ---
    const now = new Date();
    const timeContext = `\n[Bối cảnh]: ${now.getHours()}:${now.getMinutes()} ngày ${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}.`;
    systemPrompt += timeContext;

    // --- LANGUAGE RULE (Simplified to avoid confusion) ---
    let langRule = "Trả lời bằng chính ngôn ngữ khách đang hỏi.";
    if (req.body.lang && req.body.lang !== 'auto') {
      const languageNames = { 'vi': 'Tiếng Việt', 'en': 'English', 'jp': 'Japanese', 'kr': 'Korean', 'fr': 'French' };
      langRule = `BẮT BUỘC TRẢ LỜI BẰNG ${languageNames[req.body.lang] || 'Tiếng Việt'}.`;
    }
    systemPrompt += `\n${langRule}`;

    // --- AI CONTEXT GUARD: ÉP AI CHỈ TRẢ LỜI ĐÚNG PHẠM VI ---
    systemPrompt += `
QUY TẮC CỐT LÕI:
1. Nếu hỏi nội dung KHÔNG liên quan du lịch/hệ thống, hãy từ chối khéo léo.
${placeContext ? `2. BẠN ĐANG TRONG CHẾ ĐỘ 'CHUYÊN GIA DỊCH VỤ CỤ THỂ'. KHÔNG ĐƯỢC tư vấn sang các địa điểm hoặc dịch vụ khác ngoài "${placeContext.name}". Nếu khách hỏi nơi khác, hãy nhắc khách rằng bạn là chuyên gia riêng của "${placeContext.name}".` : '2. Tư vấn du lịch rộng khắp dựa trên dữ liệu hệ thống.'}
3. Trả lời dưới 120 từ.
4. Sử dụng Markdown súc tích.
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
    let isModification = lowerMsg.includes('đổi') || lowerMsg.includes('doi') || lowerMsg.includes('k thích') || lowerMsg.includes('không thích') || lowerMsg.includes('khong thich');
    let isItineraryRequest = itineraryKeywords.some(k => lowerMsg.includes(k)) || 
                             (lowerMsg.includes('lịch') && lowerMsg.includes('trình')) ||
                             (lowerMsg.includes('kế') && lowerMsg.includes('hoạch'));

    if (isModification && (lowerMsg.includes('điểm') || lowerMsg.includes('diem') || lowerMsg.includes('chỗ') || lowerMsg.includes('cho') || lowerMsg.includes('này') || lowerMsg.includes('nay'))) {
      isItineraryRequest = true;
    }

    if (isItineraryRequest) {
      try {
        // Trích xuất thông tin từ tin nhắn - regex linh hoạt hơn
        // Ưu tiên: tìm tên địa điểm sau giới từ
        let destMatch = message.match(/(?:ở|tại|đến|đi|cho|lên lịch|lập lịch|tạo lịch|hành trình|trip to)\s+([A-ZÀ-Ỹa-zà-ỹ][a-zà-ỹ]+(?:\s[A-ZÀ-Ỹa-zà-ỹ][a-zà-ỹ]+)*)/i);
        // Fallback: tìm địa điểm ngay trước số ngày (vd: "Đà Lạt 3 ngày")
        if (!destMatch) {
          destMatch = message.match(/([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s[A-ZÀ-Ỹ][a-zà-ỹ]+){0,2})\s+\d+\s*(?:ngày|ngay)/i);
        }
        // Fallback: tìm tên tỉnh thành phổ biến trực tiếp trong câu
        if (!destMatch) {
          const popularDests = ['Hà Nội', 'Hồ Chí Minh', 'Sài Gòn', 'Đà Lạt', 'Đà Nẵng', 'Hội An', 'Nha Trang', 'Phú Quốc', 'Huế', 'Hạ Long', 'Sa Pa', 'Cần Thơ', 'Mũi Né', 'Phan Thiết', 'Tuyên Quang', 'Ninh Bình', 'Quy Nhơn', 'Bình Định', 'Vũng Tàu', 'Côn Đảo', 'Bình Thuận', 'Lào Cai', 'Điện Biên'];
          const found = popularDests.find(d => message.toLowerCase().includes(d.toLowerCase()));
          if (found) destMatch = [null, found];
        }
        const daysMatch = message.match(/(\d+)\s*(?:ngày|ngay|day)/i);
        const budgetMatch = message.match(/(\d+)\s*(?:triệu|tr|trieu)/i);
        const autoGenKeywords = ['tùy mày', 'tùy m', 'tự động', 'auto', 'tùy ý', 'tự tạo', 'muốn gì cũng được', 'bất kỳ', 'tuy may', 'tuy m', 'tu dong', 'tuy y', 'tu tao', 'muon gi cung duoc', 'bat ky'];
        const isAutoGen = autoGenKeywords.some(k => lowerMsg.includes(k));

        const destination = destMatch ? destMatch[1].trim() : null;
        const days = daysMatch ? parseInt(daysMatch[1]) : (isAutoGen ? 3 : null);
        const budget = budgetMatch ? parseInt(budgetMatch[1]) : null;

        // --- QUYẾT ĐỊNH: PROPOSALS HAY DIRECT ITINERARY? ---
        const isSpecific = destination && days;

        if (isSpecific) {
          console.log(`✈️ [Itinerary] Generating DIRECT Plan for: ${destination}, ${days} ngày...`);
          const directCompletion = await groq.chat.completions.create({
            messages: [
              {
                role: 'system',
                content: `Bạn là chuyên gia lập lịch trình du lịch Việt Nam. Hãy tạo một lịch trình chi tiết và trả về CHỈ JSON.
Cấu trúc JSON:
{
  "tripSummary": "Mô tả ngắn gọn",
  "destination": "Tên tỉnh/thành",
  "days": number,
  "estimatedCost": "Khoảng giá",
  "itinerary": [
    {
      "day": number,
      "title": "Tên ngày",
      "activities": [
        { "time": "HH:MM", "name": "Hoạt động", "location": "Địa điểm", "tip": "Mẹo nhỏ", "cost": "Giá ước tính" }
      ]
    }
  ]
}`
              },
              ...chatHistory.slice(-4),
              { role: 'user', content: `Lập lịch trình ${days} ngày tại ${destination}. ${message}` }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            response_format: { type: 'json_object' }
          });

          const itinJson = JSON.parse(directCompletion.choices[0]?.message?.content || '{}');
          if (itinJson && itinJson.itinerary) {
            const answer = `Tuyệt vời! Mình đã lên lịch trình chi tiết cho chuyến đi ${destination} trong ${days} ngày của bạn đây. Bạn xem qua nhé! ✨\n[ITIN_CARD:${JSON.stringify(itinJson)}]`;
            
            if (chatbotDb.readyState === 1) {
              if (!currentSessionId) currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
              await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'user', text: message }).save();
              await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'model', text: answer }).save();
            }

            return res.json({
              success: true,
              answer: answer,
              sessionId: currentSessionId,
              itineraryCard: itinJson,
              source: 'direct-itinerary-generator'
            });
          }
        }

        // --- TẠO NHIỀU ĐỀ XUẤT LỊCH TRÌNH (PROPOSALS) ---
        const finalDays = days || 3;
        const finalBudget = budget || 5;
        const destContext = destination ? `tại ${destination}` : 'tại Việt Nam';
        console.log(`✈️ [Itinerary] Generating Proposals for: ${destination || 'Auto-context'}, ${finalDays} ngày, ${finalBudget}tr...`);

        const itinCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `Bạn là chuyên gia tư vấn du lịch Việt Nam. Thay vì tạo một lịch trình chi tiết ngay lập tức, hãy đề xuất 3 PHƯƠNG ÁN (PROPOSALS) khác nhau về phong cách cho chuyến đi này.
Mỗi phương án phải có: 
- title: Tên ngắn gọn (Ví dụ: "Chill & Thư giãn", "Khám phá mạo hiểm", "Ẩm thực & Văn hóa")
- destination: Tỉnh/Thành phố
- days: Số ngày
- budget: Ngân sách ước tính
- style: Phong cách chuyến đi
- description: Mô tả ngắn gọn 1-2 câu về những gì họ sẽ được trải nghiệm.

Trả về CHỈ JSON theo format:
{
  "proposals": [
    { "title": "string", "destination": "string", "days": number, "budget": "string", "style": "string", "description": "string" }
  ]
}`
            },
            ...chatHistory.slice(-6),
            { role: 'user', content: `${message} (${finalDays} ngày, ngân sách ~${finalBudget}tr, ${destContext})` }
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.8,
          max_tokens: 1500,
          response_format: { type: 'json_object' }
        });

        const itinRaw = itinCompletion.choices[0]?.message?.content || '{}';
        let itineraryData = null;
        try { itineraryData = JSON.parse(itinRaw); }
        catch(parseErr) { console.error('Lỗi parse JSON proposals:', parseErr.message); }

        if (itineraryData && itineraryData.proposals && itineraryData.proposals.length > 0) {
          const summaryMsg = `Mình tìm thấy ${itineraryData.proposals.length} phương án tuyệt vời cho chuyến đi của bạn! Bạn thích phong cách nào nhất? Click để xem chi tiết và chỉnh sửa nhé:\n[ITIN_PROPOSALS:${JSON.stringify(itineraryData.proposals)}]`;

          if (chatbotDb.readyState === 1) {
            if (!currentSessionId) currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'user', text: message }).save();
            await new Conversation({ userId: sessionKey, sessionId: currentSessionId, role: 'model', text: summaryMsg, hasProposal: true }).save();
          }

          return res.json({
            success: true,
            answer: summaryMsg,
            sessionId: currentSessionId,
            proposals: itineraryData.proposals, // Trả về mảng các đề xuất
            source: 'itinerary-proposals-generator'
          });
        }
      } catch (itinErr) {
        console.error('Lỗi generate lịch trình:', itinErr.message);
        // Nếu lỗi, fallthrough xuống AI thường
      }
    }

    try {
      // Ép model tuân thủ ngôn ngữ bằng cách nhúng thẳng lệnh vào câu hỏi cuối cùng
      let finalUserMessage = message;
      if (targetLang !== 'auto') {
        const langName = languageNames[targetLang] || 'Tiếng Việt';
        finalUserMessage = `${message}\n\n[SYSTEM INSTRUCTION: You MUST reply in ${langName}. Do NOT use any other language.]`;
      } else {
        finalUserMessage = `${message}\n\n[SYSTEM INSTRUCTION: Detect the language of my message and reply in that same language.]`;
      }

      // 4. Gọi Groq API
      // Sử dụng model mạnh hơn (70b) cho chế độ chuyên gia dịch vụ để tránh từ chối trả lời về giá
      const useBetterModel = (placeContext || userRole === 'business');
      const currentGroq = userRole === 'business' ? groqBusiness : groq;
      
      const completion = await currentGroq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory,
          { role: "user", content: finalUserMessage }
        ],
        model: useBetterModel ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant",
        temperature: useBetterModel ? 0.7 : 0.6,
        max_tokens: useBetterModel ? 500 : 180
      });

      const aiAnswer = completion.choices[0]?.message?.content || "Mình chưa nghe rõ, bạn nói lại nhé!";

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

      const finalMeta = await generateResponseMetadata(message, aiAnswer, locationContext);

      res.json({
        success: true,
        answer: aiAnswer,
        sessionId: currentSessionId,
        messageId: res.locals.messageId || null,
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
                  const learnCompletion = await groq.chat.completions.create({
                      messages: [
                          { role: "system", content: "BẠN LÀ BỘ NÃO SIÊU VIỆT. Nhiệm vụ: Trích xuất thông tin CỐT LÕI từ tin nhắn để AI ghi nhớ lâu dài. \nPhân loại: \n1. [SỞ THÍCH]: Đồ ăn, phong cảnh, thói quen... \n2. [SỰ KIỆN]: Đang đi với ai, đang ở đâu, chuyện đã xảy ra... \n3. [TÂM TRẠNG]: Buồn, vui, mệt mỏi, hào hứng... \nChỉ trả về DUY NHẤT 1 câu tổng hợp cực ngắn gọn. Nếu không có gì đáng nhớ, trả về 'NULL'." },
                          { role: "user", content: `Tin nhắn: "${message}"` }
                      ],
                      model: "llama-3.1-8b-instant",
                      temperature: 0.1,
                      max_tokens: 80
                  });
                  
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
      console.error('❌ Groq API Error Detail:', groqError);
      if (groqError.response && groqError.response.data) {
        console.error('Groq Response Data:', JSON.stringify(groqError.response.data));
      }
      res.status(500).json({ success: false, answer: "Bộ não AI siêu tốc đang bảo trì, vui lòng thử lại sau!" });
    }
  } catch (error) {
    console.error('Critical Chat Error:', error);
    res.status(500).json({ success: false, answer: 'Lỗi hệ thống.' });
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
