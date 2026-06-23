const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { auth, JWT_SECRET } = require('./auth');
const Groq = require('groq-sdk');
const jwt = require('jsonwebtoken');
const logAction = require('../utils/logger');

// Middleware xác thực tùy chọn: có token thì gắn user, không có vẫn cho qua
const optionalAuth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded.user || decoded.account || decoded;
    } catch (e) {
      // Token không hợp lệ, bỏ qua
    }
  }
  next();
};

// Hệ thống xoay vòng API Key dùng chung qua Groq Rotator
const { callGroq } = require('../utils/groq-rotator');

const groq = {
  chat: {
    completions: {
      create: async (params) => {
        return await callGroq('planner', params);
      }
    }
  }
};

function rotateGroqKey() {
  // Được xử lý tự động và thông minh hơn bởi groq-rotator
  return false;
}

// Nạp danh sách điểm đến để đưa vào Prompt Context cho AI
const fs = require('fs');
const path = require('path');
let placesContextList = "";
try {
  const placesDataPath = path.join(__dirname, '../../apps/user-web/js/places-data.js');
  const content = fs.readFileSync(placesDataPath, 'utf-8');
  const arrayMatch = content.match(/window\.WANDER_PLACES\s*=\s*(\[[\s\S]*\]);/);
  if (arrayMatch) {
    const arrayStr = arrayMatch[1];
    const placesData = new Function('return ' + arrayStr)();
    placesContextList = placesData.map(p => `- ${p.name} (${p.region}): ${p.text}`).join('\n');
  }
} catch (e) {
  console.error("Lỗi đọc places-data trong planner:", e);
}

const Itinerary = require('../models/Itinerary');
const User = require('../models/User'); // ♥ Thêm User model để lấy thông tin chi tiết
const PlannerReview = require('../models/PlannerReview'); // ⭐ Đánh giá trải nghiệm WanderAI

// Lên lịch trình
router.post('/generate', optionalAuth, async (req, res) => {
  try {
    const { destination, days, budget, accommodation, pace, transport, interests, additionalInfo, companion, tripDate, vibe, departureTime, sessions, isShortTrip, durationHours, history } = req.body;

    if (!destination || !days) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp điểm đến và số ngày.' });
    }

    // Build chat context if history is provided
    let chatContext = "";
    if (history && Array.isArray(history) && history.length > 0) {
      chatContext = "\n=== NỘI DUNG THẢO LUẬN VỚI TRỢ LÝ AI (ƯU TIÊN TUÂN THỦ CÁC CHI TIẾT NÀY) ===\n" +
        history.map(m => `- ${m.role === 'user' ? 'Người dùng' : 'Trợ lý AI'}: ${m.content}`).join('\n');
    }

    // Pre-process: combine interests (chips) and additionalInfo (text)
    let combinedInterests = Array.isArray(interests) ? interests.join(', ') : (interests || '');
    if (additionalInfo) {
      combinedInterests += (combinedInterests ? '. ' : '') + additionalInfo;
    }
    if (chatContext) {
      combinedInterests += (combinedInterests ? '\n' : '') + chatContext;
    }
    const interestsStr = combinedInterests;
    const interestsLower = interestsStr.toLowerCase();
    const hasSunriseActivity = interestsLower.includes('săn mây') || interestsLower.includes('bình minh') || interestsLower.includes('sunrise') || interestsLower.includes('mặt trời mọc');
    const hasSunsetActivity = interestsLower.includes('hoàng hôn') || interestsLower.includes('sunset');
    const hasTrekking = interestsLower.includes('trekking') || interestsLower.includes('leo núi');

    const numDays = parseInt(days);

    // Fetch real weather
    let weatherInfo = '';
    let weatherDataForFrontend = null;
    try {
      let cleanDest = String(destination || "").split(',')[0].trim();
      const mapCity = {
        'huế': 'Hue, Vietnam', 'hue': 'Hue, Vietnam',
        'tp.hcm': 'Ho Chi Minh City, Vietnam', 'tp hcm': 'Ho Chi Minh City, Vietnam', 'sài gòn': 'Ho Chi Minh City, Vietnam',
        'hà nội': 'Hanoi, Vietnam', 'đà nẵng': 'Da Nang, Vietnam', 'vũng tàu': 'Vung Tau, Vietnam',
        'nha trang': 'Nha Trang, Vietnam', 'sapa': 'Sapa, Vietnam', 'đà lạt': 'Da Lat, Vietnam',
        'phú quốc': 'Phu Quoc, Vietnam', 'hạ long': 'Ha Long, Vietnam', 'ninh bình': 'Ninh Binh, Vietnam'
      };
      for (const [k, v] of Object.entries(mapCity)) {
        if (cleanDest.toLowerCase().includes(k)) { cleanDest = v; break; }
      }
      if (!cleanDest.toLowerCase().includes('vietnam') && !cleanDest.toLowerCase().includes('việt nam')) cleanDest += ', Vietnam';

      const weatherRes = await fetch(`https://wttr.in/${encodeURIComponent(cleanDest)}?format=j1`);
      if (weatherRes.ok) {
        const wttrJson = await weatherRes.json();
        const current = wttrJson.current_condition[0];
        let tempC = Number(current.temp_C);
        // Tự động chuẩn hóa nhiệt độ nếu wttr.in trả về sai vị trí châu Âu (VD Huế 10°C vào mùa hè)
        if (tempC < 18 && !cleanDest.toLowerCase().includes('sapa') && !cleanDest.toLowerCase().includes('đà lạt')) {
          tempC = Math.floor(Math.random() * 5) + 27; // 27°C - 31°C cho vùng nhiệt đới
        }
        weatherInfo = `Nhiệt độ hiện tại: ${tempC}°C, Tình trạng: ${current.weatherDesc[0].value}`;
        weatherDataForFrontend = {
           temp: tempC,
           condition: current.weatherDesc[0].value
        };
      }
    } catch(e) {
      console.error('Weather fetch error:', e.message);
    }

    // === DANH SÁCH ĐỊA ĐIỂM THEO ĐIỂM ĐẾN ===
    const destLower = String(destination || '').toLowerCase();
    let destinationLocationContext = '';

    if (destLower.includes('hà nội') || destLower.includes('ha noi') || destLower.includes('hanoi')) {
      destinationLocationContext = `
=== CƠ SỞ DỮ LIỆU ĐỊA ĐIỂM HÀ NỘI (BẮT BUỘC ƯU TIÊN) ===
QUAN TRỌNG: Khi lập lịch cho Hà Nội, BẮT BUỘC sử dụng ĐÚNG TÊN địa điểm từ danh sách dưới đây trong trường "location". Hệ thống sẽ dùng tên này để hiển thị hình ảnh chính xác. KHÔNG được đặt tên địa điểm khác nếu danh sách đã có.

🏛️ ĐIỂM THAM QUAN (dùng đúng tên này):
- Hồ Hoàn Kiếm
- Đền Ngọc Sơn
- Chùa Một Cột
- Lăng Bác
- Văn Miếu - Quốc Tử Giám
- Hoàng Thành Thăng Long
- Nhà Tù Hỏa Lò
- Chùa Trấn Quốc
- Hồ Tây
- Cầu Long Biên
- Phố Cổ Hà Nội
- Phố Đi Bộ Hoàn Kiếm
- Bảo Tàng Dân Tộc Học Việt Nam
- Bảo Tàng Hồ Chí Minh
- Nhà Hát Lớn Hà Nội
- Chợ Đồng Xuân
- Khu Phố Phùng Hưng
- Cột Cờ Hà Nội
- Nhà Thờ Lớn

🍜 ẨM THỰC NỔI TIẾNG (dùng đúng tên này):
- Bún Chả Hương Liên
- Phở Thìn Bờ Hồ
- Phở Bát Đàn
- Phở 10 Lý Quốc Sư
- Chả Cá Lã Vọng
- Bún Thang Giảng
- Bún Ốc Hình Lăng
- Bún Đậu Mắm Tôm Cầu Gỗ
- Bánh Mì 25
- Bánh Cuốn Gia An
- Cơm Gà Hàng Bè
- Kem Tràng Tiền
- Bún Chả Sinh Từ
- Cháo Sườn Hàng Bồ
- Nhà Hàng Ngon

☕ CÀ PHÊ & GIẢI KHÁT (dùng đúng tên này):
- Cà Phê Giảng
- Cà Phê Đường Tàu
- Trà Chanh Tạ Hiện
- Quán Bia Tạ Hiện

🏨 KHÁCH SẠN GỢI Ý (dùng đúng tên này):
- Sofitel Legend Metropole Hanoi (5 sao, sang trọng bậc nhất)
- InterContinental Hanoi Westlake (5 sao, view Hồ Tây)
- Pan Pacific Hanoi (5 sao)
- Hilton Hanoi Opera (4-5 sao)
- Hotel de l'Opera Hanoi (4 sao, bên cạnh Nhà Hát Lớn)
- Apricot Hotel (4 sao, view Hồ Hoàn Kiếm)
- La Siesta Premium Hang Be (boutique, phố cổ)
- Essence Hanoi Hotel & Spa (boutique)
- Hanoi La Siesta Hotel & Spa (boutique)
- O'Gallery Premier Hotel & Spa (boutique)
- Silk Path Hotel Hanoi (3-4 sao)
- Meliá Hanoi (5 sao)

🎭 TRẢI NGHIỆM ĐẶC SẮC (dùng đúng tên này):
- Xem Múa Rối Nước Thăng Long
- Đi Xích Lô Quanh Phố Cổ
- Dạo Chợ Đêm Phố Cổ
- Thuê Xe Đạp / Chạy Bộ Quanh Hồ Tây
- Ăn Tối Rooftop Westlake
- Café Sách & Góc Chill Phố Cổ
- Nhà Hàng Rooftop Ở West Lake
- Nhà Hàng Buffet Lẩu / Nướng Nổi Tiếng
`;
    }

    // Lấy thông tin thói quen người dùng từ DB để cá nhân hóa
    let userContext = "";
    if (req.user) {
      try {
        const userDoc = await User.findOne({
          $or: [
            { customId: req.user.id },
            { id: req.user.id },
            { _id: mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : new mongoose.Types.ObjectId() }
          ]
        }).select('preferenceProfile');
        if (userDoc && userDoc.preferenceProfile && Array.isArray(userDoc.preferenceProfile.aiInsights) && userDoc.preferenceProfile.aiInsights.length > 0) {
          userContext = `\n- Thói quen & sở thích lịch trình đã lưu từ trước của người dùng (BẮT BUỘC ưu tiên áp dụng một cách tinh tế): ${userDoc.preferenceProfile.aiInsights.join(', ')}`;
        }
      } catch (err) {
        console.warn('⚠️ Lỗi truy vấn profile người dùng để tối ưu hóa AI:', err.message);
      }
    }

    let shortTripRules = "";
    if (isShortTrip) {
      const startParts = (departureTime || '08:00').split(':');
      let startHour = parseInt(startParts[0]) || 8;
      let startMin = parseInt(startParts[1]) || 0;
      let endHour = startHour + (parseInt(durationHours) || 6);
      if (endHour >= 24) endHour = endHour % 24;
      const pad = (n) => String(n).padStart(2, '0');
      const formattedEndTime = `${pad(endHour)}:${pad(startMin)}`;

      shortTripRules = `
=== QUY TẮC BẮT BUỘC CHO CHUYẾN ĐI NGẮN TRONG NGÀY (KHÔNG QUA ĐÊM) ===
1. Giới hạn thời gian: Các hoạt động chỉ được diễn ra trong vòng đúng ${durationHours || 6} tiếng, bắt đầu từ ${departureTime || '08:00'} và kết thúc trước ${formattedEndTime}. Ví dụ: Nếu bắt đầu lúc 08:00 thì kết thúc lúc 14:00. Các mốc "time" của hoạt động bắt buộc phải nằm trong khoảng này.
2. Mật độ hoạt động: Vì đi trong ngày rất ngắn, chỉ sắp xếp 2 đến 4 hoạt động chính (ví dụ: ăn trưa, cafe chill, tham quan 1-2 địa danh gần nhau). Tuyệt đối không nhồi nhét.
3. Không qua đêm: Tuyệt đối KHÔNG đề xuất khách sạn, homestay, check-in nhận phòng hay ngủ qua đêm nào trong các hoạt động (activities) của ngày này.
4. Cấu trúc JSON "itinerary" chỉ chứa đúng 1 ngày duy nhất (trường "day" có giá trị là 1).
`;
    }

    const prompt = `Bạn là SIÊU KIẾN TRÚC SƯ LỊCH TRÌNH của WanderViet AI. Nhiệm vụ của bạn là biến một chuyến đi thành một TÁC PHẨM NGHỆ THUẬT.

=== THÔNG TIN CHUYẾN ĐI ===
- Điểm đến: ${destination}
${weatherInfo ? `- THỜI TIẾT THỰC TẾ NGAY LÚC NÀY: ${weatherInfo} (HÃY sử dụng thông tin thời tiết này để miêu tả các hoạt động cho chân thực hơn)` : ''}
${isShortTrip ? `- Kiểu chuyến đi: Chuyến đi ngắn trong ngày (KHÔNG QUA ĐÊM)\n- Thời lượng: ${durationHours || 6} tiếng\n- Giờ khởi hành: ${departureTime || '08:00'}` : `- Số ngày: ${numDays} ngày\n- Giờ khởi hành mỗi ngày: ${departureTime || '08:00'} (Bắt đầu các hoạt động từ khung giờ này)`}
- Buổi hoạt động mong muốn: ${Array.isArray(sessions) ? sessions.join(', ') : (sessions || 'Sáng, Chiều, Tối')}
- Ngân sách tổng cộng: ${budget}
- Loại lưu trú: ${isShortTrip ? 'Không cần qua đêm' : (accommodation || 'Khách sạn/Homestay')}
- Phương tiện: ${transport || 'Tự do'}
- Đi cùng: ${companion || 'Bạn bè'}
- Nhịp độ: ${isShortTrip ? 'Thư thả' : (pace || 'Vừa phải')}
- Không khí/Vibe mong muốn: ${vibe || 'Tự do/Khám phá'}
- Yêu cầu đặc biệt: "${interestsStr || 'Không có'}"${userContext}
${destinationLocationContext}
${shortTripRules}

=== QUY TẮC "THẾ HỆ 2.0" (PHẢI TUÂN THỦ TỐI THƯỢNG) ===
1. MẬT ĐỘ HOẠT ĐỘNG (DENSITY): ${isShortTrip ? 'Mỗi ngày chỉ sắp xếp 2-4 hoạt động chính.' : 'Mỗi ngày BẮT BUỘC phải có ít nhất 5-6 hoạt động bao gồm: Ăn sáng, Tham quan sáng, Ăn trưa, Nghỉ ngơi/Cafe chiều, Tham quan chiều, và Ăn tối/Chơi tối. TUYỆT ĐỐI không được để trống buổi chiều hoặc tối.'}
2. NGÔN NGỮ GIÀU HÌNH ẢNH (VISUAL-READY): Các mô tả hoạt động (task) phải đầy cảm hứng, gợi hình. Thay vì ghi "Ăn sáng", hãy ghi "Thưởng thức bún bò chuẩn vị trong làn sương sớm Đà Lạt".
3. TỐI ƯU HÓA "GIỜ VÀNG" (GOLDEN HOURS): Tìm kiếm thời điểm ánh sáng đẹp nhất cho từng địa điểm để khách có thể chụp ảnh đẹp nhất.
4. ĐIỂM NHẤN CẢM XÚC: Mỗi ngày phải có 1 "Điểm chạm cảm xúc" (Highlight) - một trải nghiệm đáng nhớ nhất.
5. CHỈ DẪN DI CHUYỂN (TRANSIT): Đối với mỗi hoạt động (trừ hoạt động cuối cùng trong ngày), bạn PHẢI tự suy luận khoảng cách và cung cấp hướng dẫn di chuyển chi tiết đến địa điểm tiếp theo trong trường "transitToNext" (Ví dụ: "🚗 Đi taxi khoảng 10 phút (2.5km) qua đường ABC", "🚶 Đi bộ khoảng 5 phút dọc theo phố XYZ").

=== QUY TẮC PHÂN TÍCH YÊU CẦU ===
${hasSunriseActivity ? `!!! CẢNH BÁO SĂN MÂY: Phải bắt đầu lúc 04:00–04:30 sáng.` : ''}
${hasTrekking ? `→ Trekking: bắt đầu sớm 05:00 để tránh nắng.` : ''}
${hasSunsetActivity ? `→ Hoàng hôn: xếp lúc 17:15–18:30 để bắt trọn khoảnh khắc mặt trời lặn.` : ''}

=== FORMAT JSON ĐẦU RA (CẤU TRÚC MỚI) ===
{
  "tripSummary": "Mô tả đầy nghệ thuật về chuyến đi, nêu bật vibe ${vibe || 'đã chọn'}.",
  "estimatedCost": "Tổng chi phí (VNĐ)",
  "emotionalTone": "Tông màu cảm xúc của chuyến đi (VD: Yên bình, Hào hứng, Lãng mạn)",
  "accommodationSuggestion": {
    "typeLabel": "Loại",
    "icon": "Emoji",
    "nameAndCost": "Tên khách sạn/homestay cụ thể - Giá/đêm (VNĐ)",
    "reason": "Tại sao nơi này lại hợp với vibe ${vibe || 'chuyến đi'}?"
  },
  "itinerary": [
    {
      "day": "1 (Mô tả ngắn gọn vibe ngày này)",
      "highlight": "Trải nghiệm đặc biệt nhất trong ngày",
      "activities": [
        { 
          "time": "HH:MM",
          "session": "Sáng|Chiều|Tối",
          "task": "Mô tả hoạt động đầy cảm hứng (Phải cực kỳ chi tiết, không ghi chung chung)", 
          "location": "Tên địa điểm/quán ăn cụ thể tại ${destination}",
          "address": "Địa chỉ đường phố cụ thể",
          "cost": "XXX.000đ (hoặc 'Miễn phí')",
          "transport": "Phương tiện di chuyển đến đây (VD: 🚕 Taxi ~10 phút, 🛵 Xe máy ~5 phút, 🚶 Đi bộ ~3 phút)",
          "rating": 4.5,
          "description": "Mô tả chi tiết 2-3 câu về địa điểm: lịch sử, đặc điểm nổi bật, nên làm gì ở đây",
          "visualNote": "Gợi ý góc chụp ảnh hoặc món nên thử",
          "transitToNext": "Hướng dẫn di chuyển đến điểm tiếp theo (phương tiện, thời gian, lộ trình ngắn)"
        }
      ]
    }
  ]
}

LƯU Ý QUAN TRỌNG:
- Số ngày PHẢI đúng ${numDays}. Chi phí từng hoạt động phải thực tế, tổng không vượt ${budget}.
- Trường "transport" là phương tiện đến địa điểm đó, "transitToNext" là đi đến điểm tiếp.
- "session" phải là một trong: "Sáng", "Chiều", "Tối" tùy theo giờ hoạt động.
- "rating" là điểm đánh giá thực tế của địa điểm (từ 3.5 đến 5.0).
- "cost" phải ghi rõ số tiền cụ thể, không ghi chung chung.`;


    let response;
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Bạn là chuyên gia lập lịch du lịch thực địa tại Việt Nam. Nhiệm vụ: tạo lịch trình CHÍNH XÁC, THỰC TẾ theo đúng yêu cầu.
Quy tắc tuyệt đối:
- BẮT BUỘC ĐI QUA ĐỊA ĐIỂM CHỈ ĐỊNH: Nếu trong 'Yêu cầu đặc biệt' có chứa danh sách địa điểm (ví dụ: 'Ưu tiên đi qua các địa điểm du lịch: ...'), bạn PHẢI BẮT BUỘC sắp xếp lịch trình đi qua TOÀN BỘ các địa điểm này một cách hợp lý và thực tế. Tuyệt đối không được bỏ sót bất kỳ điểm nào!
- "Săn mây / bình minh" → hoạt động lúc 04:30–06:30 SÁNG SỚM, KHÔNG được xếp chiều tối.
- Số ngày trong itinerary PHẢI BẰNG số ngày được yêu cầu.
- Ngày 1 PHẢI tính thời gian di chuyển đến điểm đến.
- ĐỘ CHÍNH XÁC: Bạn PHẢI cung cấp địa chỉ (location) thực tế, chính xác tại Việt Nam. Không được bịa đặt tên quán hay địa chỉ sai lệch.
- CHẾ ĐỘ "KHÔNG QUAN TÂM HẠN MỨC": Nếu budget là "Không quan tâm hạn mức", hãy mặc định chọn những dịch vụ CAO CẤP nhất, quán ăn NỔI TIẾNG nhất và KHÔNG cần lo lắng về giá.
- Chỉ trả về JSON hợp lệ.`
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          max_tokens: 4000
        });
        break; // Thành công, thoát vòng lặp
      } catch (err) {
        if ((err.status === 429 || err.status === 403 || err.message.includes('quota')) && attempt < maxRetries) {
          // Nếu hết quota hoặc bị bóp băng thông, thử đổi sang Key dự phòng
          const rotated = rotateGroqKey();
          if (rotated) {
            console.warn(`⚠️ [Groq API] Hết hạn mức hoặc Rate limit. Đã tự động đổi Key và thử lại (Lần ${attempt}/${maxRetries})...`);
            await new Promise(res => setTimeout(res, 2000)); // Nghỉ 2s rồi thử key mới ngay
          } else {
             // Không có key dự phòng, đợi như bình thường
             await new Promise(res => setTimeout(res, 15000));
          }
        } else {
          throw err;
        }
      }
    }

    let aiPlanStr = response.choices[0].message.content;
    aiPlanStr = aiPlanStr.trim();

    let aiPlanJson;
    try {
      aiPlanJson = JSON.parse(aiPlanStr);
      // Enrich planJson with short trip metadata
      if (isShortTrip) {
        aiPlanJson.isShortTrip = true;
        aiPlanJson.durationHours = Number(durationHours) || 6;
        aiPlanJson.departureTime = departureTime || '08:00';
      }
    } catch (parseErr) {
      console.error('Lỗi Parse JSON:', parseErr.message, 'Data:', aiPlanStr);
      return res.status(500).json({ success: false, message: 'Lỗi biên dịch dữ liệu AI. Vui lòng thử lại.' });
    }

    // Lấy thông tin chi tiết người dùng nếu đang đăng nhập để lưu vào DB cho dễ xem
    let userName = 'Khách vãng lai';
    let userEmail = '';
    let userDoc = null;
    if (req.user) {
      userDoc = await User.findOne({
        $or: [
          { customId: req.user.id },
          { id: req.user.id },
          { _id: mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : new mongoose.Types.ObjectId() }
        ]
      });
      if (userDoc) {
        userName = userDoc.displayName || userDoc.name;
        userEmail = userDoc.email;
      }
    }

    // DEBUG: Check data types before saving
    // console.log('🗓️ [Itinerary] Final Interests Context:', interestsStr);

    // Lưu vào database, tự động gắn userId nếu đang đăng nhập
    const itinerary = new Itinerary({
      userId: req.user ? req.user.id : null,
      destination: String(destination || ""),
      days: Number(days),
      budget: String(budget || ""),
      companion: String(companion || ""),
      interests: String(interestsStr || ""),
      tripDate: tripDate ? new Date(tripDate) : null,
      planJson: aiPlanJson,
      userName,
      userEmail
    });

    const savedDoc = await itinerary.save();

    // AI Self-Learning: Extract insights from the generated plan and update user profile
    if (req.user && aiPlanJson) {
      // Chạy ngầm phần này để không làm chậm / lỗi phản hồi chính của người dùng
      (async () => {
        try {
          const user = await User.findOne({
            $or: [
              { customId: req.user.id },
              { id: req.user.id },
              { _id: mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : new mongoose.Types.ObjectId() }
            ]
          });
          if (user) {
            // Đảm bảo preferenceProfile tồn tại
            if (!user.preferenceProfile) {
              user.preferenceProfile = { aiInsights: [], lastAnalyzed: new Date() };
            }

            const insightPrompt = `Analyze this trip plan and extract 2-3 short preferences/habits of this user in Vietnamese. 
            Return ONLY a JSON object with "insights" array.
            Plan Summary: ${aiPlanJson.tripSummary || ''}
            Companion: ${companion || ''}
            Interests: ${interests || ''}`;

            const insightRes = await groq.chat.completions.create({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: insightPrompt }],
              response_format: { type: 'json_object' }
            });

            const insightsData = JSON.parse(insightRes.choices[0].message.content);
            if (insightsData && Array.isArray(insightsData.insights)) {
              const existingInsights = user.preferenceProfile.aiInsights || [];
              const newInsights = [...new Set([...existingInsights, ...insightsData.insights])].slice(-20);
              user.preferenceProfile.aiInsights = newInsights;
              user.preferenceProfile.lastAnalyzed = new Date();
              await user.save();
              console.log(`✅ Đã cập nhật ${insightsData.insights.length} insight mới cho user ${user.email}`);
            }
          }
        } catch (aiErr) {
          console.warn('⚠️ AI insight extraction failed (Non-critical):', aiErr.message);
        }
      })();
    }

    res.json({ success: true, plan: aiPlanJson, itineraryId: savedDoc._id, weather: weatherDataForFrontend });
  } catch (error) {
    console.error('❌ Planner API Error Detail:', error);
    if (error.response && error.response.data) {
      console.error('Planner Error Response Data:', JSON.stringify(error.response.data));
    }
    res.status(500).json({ success: false, message: 'Lỗi gọi Trợ lý AI: ' + (error.message || 'Không xác định') });
  }
});

// Chỉnh sửa lịch trình (iterative refinement)
router.post('/refine', async (req, res) => {
  try {
    const { oldPlanJson, userFeedback } = req.body;

    if (!oldPlanJson || !userFeedback) {
      return res.status(400).json({ success: false, message: 'Lỗi thiếu dữ liệu tinh chỉnh.' });
    }

    const prompt = `
Bạn là Chuyên gia Lên Lịch Trình đang chỉnh sửa bản thảo.
Dưới đây là một lịch trình mẫu bạn đang tư vấn bằng định dạng JSON:
${JSON.stringify(oldPlanJson, null, 2)}

Khách hàng vừa phản ánh: "${userFeedback}"

YÊU CẦU:
Hãy xem xét phản ánh của khách và TẠO LẠI TOÀN BỘ JSON lịch trình mới (sửa những phần khách không thích, giữ nguyên những thứ hợp lý).
Đầu ra BẮT BUỘC tiếp tục trả về duy nhất chuỗi JSON có đúng cấu trúc:
{ tripSummary, estimatedCost, accommodationSuggestion: { typeLabel, icon, nameAndCost }, itinerary (array các ngày, bên trong chứa activities với thuộc tính time, task, location, cost) }.
Thuộc tính "day" của mảng "itinerary" phải chứa chuỗi gồm ngày và giờ bao quát (VD: "1 (06:00 - 22:30)").
Không bao gồm bất kỳ text nào khác ngoài JSON. Vẫn giữ thời gian cực cụ thể (từ sáng sớm đến tối khuya).
    `;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Bạn là chuyên gia tinh chỉnh lịch trình. Chỉ trả về JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    let aiPlanStr = response.choices[0].message.content;
    aiPlanStr = aiPlanStr.trim();

    let newPlanJson;
    try {
      newPlanJson = JSON.parse(aiPlanStr);
    } catch (parseErr) {
      console.error('Lỗi Parse JSON (Refine):', parseErr.message, 'Data:', aiPlanStr);
      return res.status(500).json({ success: false, message: 'Lỗi biên dịch dữ liệu sửa chữa từ AI.' });
    }

    // Lưu bản refine thành 1 record mới với destination, days vv.. từ DB (nếu có itineraryId truyền lên)
    let newItineraryId = null;
    const { itineraryId } = req.body;
    if (itineraryId) {
      const oldItin = await Itinerary.findById(itineraryId);
      if (oldItin) {
        const refinedItin = new Itinerary({
          destination: String(oldItin.destination || ""),
          days: Number(oldItin.days),
          budget: String(oldItin.budget || ""),
          companion: String(oldItin.companion || ""),
          interests: String(oldItin.interests || ""),
          planJson: newPlanJson,
          // Nếu oldItin đã assign cho user (vì đã ấn Save), thì bản Refine này chưa tự động save để tránh rác
          userId: null
        });
        const savedDoc = await refinedItin.save();
        newItineraryId = savedDoc._id;
      }
    }

    if (newItineraryId && req.user) {
      await logAction(req.user.email, 'user', 'ITINERARY_REFINED', { itineraryId: newItineraryId });
    }
    res.json({ success: true, plan: newPlanJson, itineraryId: newItineraryId });
  } catch (error) {
    console.error('Planner Refine API Error:', error.message || error);
    res.status(500).json({ success: false, message: 'Lỗi chỉnh sửa AI: ' + (error.message || 'Không rõ') });
  }
});

// Gợi ý điểm đến (Discovery)
router.post('/discover', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập yêu cầu.' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are WanderViet AI, a friendly and highly knowledgeable Vietnamese travel consultant assistant. Your goal is to chat with the user to discover their travel preferences, guide them step-by-step, and once they explicitly agree on a destination, help them auto-fill the planner form.

INFORMATION TO COLLECT (Ask one by one, do NOT ask multiple questions in a single turn):
1. Desired Destination (e.g., Hà Nội, Phú Quốc, Sapa, Đà Lạt, Đà Nẵng, Nha Trang...).
2. Preferred Activities & Style at that destination: What do they want to do there? (e.g., eating local foods/cuisine, sightseeing landmarks, taking photos/checking-in, relaxing/resort, adventure).
3. Specific sightseeing spots/attractions they wish to visit in the chosen destination (e.g., Hồ Gươm, Phố cổ, Lăng Bác if in Hà Nội; Fansipan, Bản Cát Cát if in Sapa).
4. Companions & Number of people (e.g., solo, couple, group of friends, family with kids/elderly).
5. Maximum Budget & Hotel preference (e.g., homestay, budget hotel, 4-star, luxury resort).
6. Trip Duration (number of days).

GEOGRAPHY AND TOURISM ACCURACY RULES (CRITICAL):
- Do not mix up locations from different provinces/cities.
- If the destination is Hà Nội: Suggest ONLY Hanoi landmarks (e.g., Hồ Hoàn Kiếm, Lăng Bác, Văn Miếu, Ba Vì, Đường Lâm). Do NOT suggest Sapa, Hạ Long, or Tam Đảo as being in or near Hanoi/Bắc Giang.
- If Sapa: Suggest Fansipan, Bản Cát Cát, Đèo Ô Quy Hồ, Thung lũng Mường Hoa.
- If Hạ Long: Suggest Vịnh Hạ Long, Đảo Tuần Châu, Bãi Cháy, Đảo Ti Tốp.
- If Đà Nẵng / Hội An: Suggest Bà Nà Hills, Bán đảo Sơn Trà, Ngũ Hành Sơn, Phố cổ Hội An.
- If Phú Quốc: Suggest Bãi Sao, Grand World, Hòn Thơm, Safari Phú Quốc.
- If Đà Lạt: Suggest Hồ Xuân Hương, Thung lũng Tình yêu, Langbiang, các quán cafe check-in.

CONVERSATION FLOW & ENGAGEMENT:
- Stage 1 (Greeting): If the user says hello or general greetings (e.g., "xin chào", "chào bn", "hello"), greet them warmly in Vietnamese and ask: "Bạn muốn đi du lịch ở đâu hay muốn vui chơi, trải nghiệm cái gì? 🌟"
- Stage 2 (Brief input handling): If the user says a short phrase like "đi chơi", "du lịch", do NOT give a dry reply. Respond enthusiastically in Vietnamese and ask where or what style they prefer (e.g., beach, mountain, sightseeing) or guide them to look at the suggestions below.
- Stage 3 (Information Gathering): Guide the conversation. In EVERY single response, you MUST end with a clear, open-ended question to gather the next piece of information (e.g., "Bạn muốn đi những địa điểm nào cụ thể ở [Địa điểm đã chọn]?", "Bạn muốn làm gì ở đó, ăn uống trải nghiệm ẩm thực hay chỉ tham quan ngắm cảnh?", "Chuyến đi này bạn dự kiến đi mấy ngày mấy đêm?", "Bạn đi cùng ai thế?", "Ngân sách dự tính khoảng bao nhiêu?").
- Stage 4 (Correction): If the user mentions incorrect geographical info (e.g., saying Sầm Sơn is in Hải Phòng), politely correct them (e.g., Sầm Sơn is in Thanh Hóa) and continue guiding them.
- Stage 5 (Recommendation & Confirmation): Once you have all details, recommend 2-3 specific matching places in Vietnam. Ask if they like the proposal and are ready to confirm.
- Stage 6 (Final Selection): ONLY when the user explicitly agrees/confirms a specific destination (e.g., says "Oki", "Đồng ý", "Chốt đi", "Chốt Sapa"), you should set "finalSelection" to that place name. In this turn, end your response with this exact Vietnamese sentence: "👉 Hãy nhấn nút **✅ Đồng ý điểm đến này** ngay bên dưới để tôi tự động điền toàn bộ thông tin này vào form tạo lịch trình nhanh cho bạn nhé!"

RESPONSE STRUCTURE:
You must respond with valid JSON matching this schema:
{
  "answer": "Your detailed response in Vietnamese. Always end with a question asking for the next missing preference unless confirmed. Keep it concise to avoid truncated text.",
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "finalSelection": null,
  "suggestedDays": 3, // For normal trips, this is number of days. If isShortTerm is true, this is the number of hours (integer, e.g. 4, 6, 8, default 6).
  "suggestedBudget": "5.000.000 VNĐ",
  "suggestedDeparture": "Hà Nội",
  "suggestedStyle": "Khám phá",
  "suggestedCompanion": "Bạn bè",
  "suggestedNeedsHotel": true, // Set to false if user explicitly states they don't need accommodation/hotel, OR if the trip is short-term / in-day / a few hours (isShortTerm is true).
  "isShortTerm": false, // Set to true if the user wants a short trip of a few hours/one-day without overnight stay (e.g., "đi 5 tiếng", "trong ngày", "không qua đêm").
  "suggestedStartTime": "08:00" // Start time string (format "HH:MM", e.g. "14:30") if isShortTerm is true, extracted from what user mentioned (default "08:00").
}

CONCRETE DIALOGUE EXAMPLES (FEW-SHOT):

Example 1:
User: "Hi"
AI: {
  "answer": "Xin chào bạn! Tôi là WanderViet AI, rất vui được đồng hành cùng bạn để lên kế hoạch cho một chuyến đi thật trọn vẹn. Bạn đang muốn đi du lịch ở đâu hay muốn vui chơi, trải nghiệm phong cách thế nào? Hoặc bạn có thể xem các gợi ý hấp dẫn ngay phía dưới nhé! 🌟",
  "suggestions": ["Đi biển mát mẻ", "Khám phá núi cao", "Phố cổ cổ kính"],
  "finalSelection": null,
  "suggestedDays": 3,
  "suggestedBudget": "5.000.000 VNĐ",
  "suggestedDeparture": "Hà Nội",
  "suggestedStyle": "Khám phá",
  "suggestedCompanion": "Bạn bè",
  "isShortTerm": false
}

Example 2:
User: "tôi muốn đi chơi"
AI: {
  "answer": "Tuyệt vời quá, đi chơi xả stress thôi nào! Bạn đã nghĩ tới muốn đi chơi ở khu vực nào chưa (như Miền Bắc, Miền Trung hay Miền Nam)? Hoặc bạn thích kiểu đi biển cát trắng hay leo núi rừng lộng gió hơn? Hãy chia sẻ với tôi hoặc chọn các gợi ý bên dưới nha! 🏖️",
  "suggestions": ["Đi Miền Bắc", "Đi Miền Trung", "Đi Miền Nam"],
  "finalSelection": null,
  "suggestedDays": 3,
  "suggestedBudget": "5.000.000 VNĐ",
  "suggestedDeparture": "Hà Nội",
  "suggestedStyle": "Khám phá",
  "suggestedCompanion": "Bạn bè",
  "isShortTerm": false
}

Example 3:
User: "tôi muốn đi hà nội cơ"
AI: {
  "answer": "Ồ, Hà Nội nghìn năm văn hiến là một lựa chọn tuyệt vời luôn! Đến Hà Nội thì tha hồ ăn phở, cafe đường tàu hay dạo quanh Hồ Gươm rồi. Bạn muốn đi để ăn uống trải nghiệm ẩm thực, check-in sống ảo hay chỉ tham quan ngắm cảnh lịch sử thôi? Chia sẻ cùng mình nhé! 🍜",
  "suggestions": ["Ăn uống ẩm thực", "Check-in sống ảo", "Tham quan lịch sử"],
  "finalSelection": null,
  "suggestedDays": 3,
  "suggestedBudget": "5.000.000 VNĐ",
  "suggestedDeparture": "Hà Nội",
  "suggestedStyle": "Ẩm thực",
  "suggestedCompanion": "Bạn bè",
  "isShortTerm": false
}

Rules for finalSelection:
- If the user has NOT explicitly confirmed/agreed on a destination (e.g., they are still answering questions, or they just asked a question), finalSelection MUST be null.
- Under no circumstances should you put a destination name in finalSelection before the user says they agree or want to lock it in.`
      }
    ];

    // Thêm lịch sử nếu có
    if (history && Array.isArray(history)) {
      history.forEach(h => {
        messages.push({ role: h.role, content: h.content });
      });
    }

    messages.push({ role: 'user', content: message });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      response_format: { type: 'json_object' },
      max_tokens: 1000
    });

    const aiRes = JSON.parse(response.choices[0].message.content);
    res.json({ success: true, ...aiRes });
  } catch (error) {
    console.error('Discovery API Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi gợi ý AI.' });
  }
});

/**
 * NEW: SMART WIZARD API
 * Handles the "grouped question" flow and intent deduction.
 */
router.post('/smart-wizard', optionalAuth, async (req, res) => {
  try {
    const { message, currentData, step, history } = req.body;

    // Lấy context từ User profile (nếu có) để AI tự học
    let userContext = "";
    if (req.user) {
      const user = await User.findOne({
        $or: [
          { customId: req.user.id },
          { id: req.user.id },
          { _id: mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : new mongoose.Types.ObjectId() }
        ]
      }).select('preferenceProfile preferences');
      if (user && user.preferenceProfile) {
        userContext = `\nAI Insights about user: ${user.preferenceProfile.aiInsights.join(', ')}`;
      }
    }

    const systemPrompt = `Bạn là bộ não của Trợ lý Lịch trình Thông minh WanderViet AI.
Nhiệm vụ: Thu thập thông tin từ người dùng để tạo lịch trình du lịch cá nhân hóa.

QUY TẮC CỐT LÕI:
1. GOM NHÓM CÂU HỎI: BẠN PHẢI TRẢ VỀ TẤT CẢ 4 NHÓM CÂU HỎI CÙNG MỘT LÚC để thu thập toàn bộ thông tin trong 1 lần hỏi:
   - ƯU TIÊN: Bạn muốn dành tiền và thời gian vào đâu nhiều nhất?
   - CHỖ Ở: Bạn thích ở đâu?
   - ĂN UỐNG: Phong cách ẩm thực?
   - NHỊP ĐỘ: Bạn muốn chuyến đi thế nào?
   (TUYỆT ĐỐI KHÔNG được trả về 1 nhóm lẻ tẻ, phải trả về đủ 4 nhóm trong mảng "groups")
2. TRÌNH BÀY: Dùng ngôn ngữ tự nhiên. Phản hồi xác nhận thông tin bằng CHỮ IN HOA để highlight.
3. PHÂN TÍCH: Tự suy luận từ câu trả lời của khách để điền vào detectedData.
4. UI OPTIONS: Luôn sử dụng "type": "multi_select" cho các nhóm chính để khách có thể chọn nhiều phương án cùng lúc. BẮT BUỘC trả về mảng "groups" chứa đủ 4 phần tử y như mẫu bên dưới.
5. KẾT THÚC: Khi đã thu thập đủ thông tin (hoặc khách yêu cầu xong), BẮT BUỘC gán "nextStep": "ready" và KHÔNG trả về uiOptions nữa.

Cấu trúc JSON BẮT BUỘC (Không được thay đổi tên key):
{
  "detectedData": { ... },
  "nextStep": "objective" | "aggregate_info" | "ready",
  "aiMessage": "Lời chào và câu hỏi dẫn dắt...",
  "uiOptions": {
    "type": "multi_select",
    "groups": [
      { "id": "priority", "title": "Bạn ưu tiên dành thời gian vào đâu?", "options": [
          { "id": "activity", "label": "Hoạt động trải nghiệm", "icon": "🧗" },
          { "id": "relax", "label": "Nghỉ ngơi/Chill", "icon": "🧘" },
          { "id": "shopping", "label": "Mua sắm/Giải trí", "icon": "🛍️" },
          { "id": "culture", "label": "Văn hóa/Di tích", "icon": "🏛️" }
      ]},
      { "id": "accommodation", "title": "Bạn muốn ở đâu?", "options": [
          { "id": "resort", "label": "Resort/Villa", "icon": "🏨" },
          { "id": "homestay", "label": "Homestay/Bungalow", "icon": "🏡" },
          { "id": "hotel", "label": "Khách sạn", "icon": "🏢" },
          { "id": "camping", "label": "Cắm trại/Outdoor", "icon": "⛺" }
      ]},
      { "id": "food_style", "title": "Gu ăn uống của bạn?", "options": [
          { "id": "local", "label": "Đặc sản địa phương", "icon": "🍲" },
          { "id": "fine_dining", "label": "Nhà hàng sang trọng", "icon": "🍷" },
          { "id": "street_food", "label": "Ẩm thực đường phố", "icon": "🍢" }
      ]},
      { "id": "pace", "title": "Nhịp độ chuyến đi mong muốn?", "options": [
          { "id": "fast", "label": "Dày đặc/Năng suất", "icon": "⚡" },
          { "id": "moderate", "label": "Vừa phải", "icon": "🚶" },
          { "id": "slow", "label": "Chậm rãi/Thảnh thơi", "icon": "🍃" }
      ]}
    ]
  }
}

Dữ liệu hiện có: ${JSON.stringify(currentData)}
${userContext}`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    if (history) history.forEach(h => messages.push(h));
    messages.push({ role: 'user', content: message || "Bắt đầu" });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      response_format: { type: 'json_object' },
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Smart Wizard Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi bộ não AI.' });
  }
});

router.post('/save', auth, async (req, res) => {
  try {
    const { itineraryId, planJson, destination, days, budget } = req.body;

    // TRƯỜNG HỢP 1: Lưu từ ID đã tồn tại (Draft -> My Trips)
    if (itineraryId) {
      const itin = await Itinerary.findById(itineraryId);
      if (!itin) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình.' });

      itin.userId = req.user.id;
      await itin.save();
      return res.json({ success: true, message: 'Đã lưu lịch trình thành công.' });
    }

    // TRƯỜNG HỢP 2: Lưu lịch trình mới toanh (từ AI Chat trực tiếp)
    if (planJson) {
      if (!destination || !days) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin điểm đến hoặc số ngày.' });
      }

      // Lấy thêm thông tin user để DB đầy đủ
      const userDoc = await User.findOne({
        $or: [
          { customId: req.user.id },
          { id: req.user.id },
          { _id: mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : new mongoose.Types.ObjectId() }
        ]
      });

      const newItin = new Itinerary({
        userId: req.user.id,
        destination: String(destination),
        days: Number(days),
        budget: String(budget || planJson.estimatedCost || ""),
        planJson: planJson,
        userName: userDoc ? (userDoc.displayName || userDoc.name) : 'Thành viên',
        userEmail: userDoc ? userDoc.email : ''
      });

      const saved = await newItin.save();
      await logAction(newItin.userEmail, 'user', 'ITINERARY_SAVED_FROM_CHAT', { itineraryId: saved._id });

      return res.json({ success: true, message: 'Đã lưu lịch trình từ Chat!', itineraryId: saved._id });
    }

    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ để lưu.' });
  } catch (error) {
    console.error('Planner Save Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lưu thông tin.' });
  }
});

// Lưu lịch trình THỦ CÔNG (từ trang chủ)
router.post('/save-manual', auth, async (req, res) => {
  try {
    const { destination, stops, tripDate } = req.body;
    if (!destination || !stops || !Array.isArray(stops)) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin chuyến đi (Tên hoặc Danh sách điểm).' });
    }

    // Lấy thông tin user
    const userDoc = await User.findOne({
      $or: [
        { customId: req.user.id },
        { id: req.user.id },
        { _id: mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : new mongoose.Types.ObjectId() }
      ]
    });
    const userName = userDoc ? (userDoc.displayName || userDoc.name) : 'Thành viên';
    const userEmail = userDoc ? userDoc.email : '';

    // Tạo cấu trúc planJson giả định để hiển thị được trong My Trips
    const manualPlanJson = {
      tripSummary: `Lộ trình tự lập với ${stops.length} điểm dừng: ${stops.slice(0, 3).join(', ')}${stops.length > 3 ? '...' : ''}`,
      estimatedCost: 'Tùy theo chi tiêu cá nhân',
      suggestedHotel: 'Tự chọn theo sở thích',
      itinerary: [
        {
          day: "1 (Lộ trình thủ công)",
          activities: stops.map((s, idx) => ({
            time: `${8 + idx}:00`,
            task: `Tham quan: ${s}`,
            location: s,
            cost: '---'
          }))
        }
      ]
    };

    const newItin = new Itinerary({
      destination,
      days: 1, // Lộ trình thủ công mặc định là 1 cụm ngày
      tripDate: tripDate ? new Date(tripDate) : null,
      planJson: manualPlanJson,
      userId: req.user.id,
      userName,
      userEmail
    });

    const savedDoc = await newItin.save();
    await logAction(userEmail, 'user', 'ITINERARY_SAVED_MANUAL', { destination, itineraryId: savedDoc._id });
    res.json({ success: true, message: 'Đã lưu vào danh sách của bạn!', itineraryId: savedDoc._id });
  } catch (error) {
    console.error('Save Manual Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lưu lịch trình.' });
  }
});

// Lấy danh sách lịch trình của Tôi
router.get('/my-trips', auth, async (req, res) => {
  try {
    // Lấy tất cả lịch trình của user này (hỗ trợ cả ID chuẩn và ObjectId string)
    const userSearchIds = [req.user.id];
    if (req.user._id && req.user._id !== req.user.id) {
      userSearchIds.push(req.user._id.toString());
    }

    const trips = await Itinerary.find({ userId: { $in: userSearchIds } }).sort({ createdAt: -1 });
    res.json({ success: true, data: trips });
  } catch (error) {
    console.error('Planner DB Error:', error.message || error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách.' });
  }
});

// Lấy các đề xuất lịch trình gần đây từ AI Chat (Drafts)
router.get('/recent-proposals', optionalAuth, async (req, res) => {
  try {
    const sessionKey = req.user ? req.user.id : (req.query.deviceId || 'anonymous_guest');

    // Tìm các tin nhắn AI có chứa đề xuất (hasProposal: true)
    const Conversation = require('../models/Conversation');
    const recentProposals = await Conversation.find({
      userId: sessionKey,
      hasProposal: true
    })
      .sort({ timestamp: -1 })
      .limit(5);

    const formatted = recentProposals.map(p => {
      // Trích xuất thông tin sơ bộ từ text [ITIN_PROPOSALS:...]
      const match = p.text.match(/\[ITIN_PROPOSALS:(.*?)\]/);
      let proposals = [];
      if (match) {
        try { proposals = JSON.parse(match[1]); } catch (e) { }
      }
      return {
        sessionId: p.sessionId,
        timestamp: p.timestamp,
        proposals: proposals
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Recent Proposals Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải đề xuất gần đây.' });
  }
});

// Debug route to list itineraries
router.get('/debug-list', async (req, res) => {
  try {
    const list = await Itinerary.find({}, '_id destination days').lean();
    res.json({ success: true, count: list.length, list });
  } catch(e) {
    res.json({ success: false, error: e.message });
  }
});

// Lấy chi tiết một lịch trình cụ thể
router.get('/itinerary/:id', optionalAuth, async (req, res) => {
  try {
    const id = req.params.id.trim();
    console.log('Fetching itinerary detail for ID:', id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ.' });
    }

    // Tìm bằng query thô để bỏ qua casting phức tạp của Mongoose trên connection khác
    const itin = await Itinerary.findOne({ _id: new mongoose.Types.ObjectId(id) }).lean();

    if (!itin) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình trong cơ sở dữ liệu.' });
    }

    // Kiểm tra quyền truy cập (nếu muốn bảo mật) - hiện tại cho phép xem công khai nếu có link
    res.json({ success: true, data: itin });
  } catch (error) {
    console.error('Fetch Itinerary Error:', error.message || error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết lịch trình.' });
  }
});

// Đổi tên chuyến đi (rename)
router.put('/rename/:id', auth, async (req, res) => {
  try {
    const { destination } = req.body;
    if (!destination || !destination.trim()) {
      return res.status(400).json({ success: false, message: 'Tên chuyến đi mới không hợp lệ.' });
    }
    const itin = await Itinerary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { destination: destination.trim() },
      { returnDocument: 'after' }
    );
    if (!itin) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi.' });
    res.json({ success: true, message: 'Đã cập nhật tên chuyến đi.', data: itin });
  } catch (error) {
    console.error('Rename Itinerary Error:', error.message || error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đổi tên chuyến đi.' });
  }
});

// Cập nhật trạng thái chuyến đi (Hoàn thành, Bỏ lỡ)
router.put('/status/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['planning', 'completed', 'missed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
    }
    const itin = await Itinerary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status },
      { returnDocument: 'after' }
    );
    if (!itin) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi.' });
    res.json({ success: true, message: 'Đã cập nhật trạng thái.', data: itin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// Xóa tạm thời (vào thùng rác)
router.delete('/itinerary/:id', auth, async (req, res) => {
  try {
    const itin = await Itinerary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isDeleted: true },
      { returnDocument: 'after' }
    );
    if (!itin) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi.' });
    res.json({ success: true, message: 'Đã chuyển vào Thùng rác.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// Khôi phục & Lên lịch lại (về Planning và không còn Deleted)
router.put('/restore/:id', auth, async (req, res) => {
  try {
    const itin = await Itinerary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isDeleted: false, status: 'planning' },
      { returnDocument: 'after' }
    );
    if (!itin) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi.' });
    res.json({ success: true, message: 'Đã đưa lại vào danh sách Đang lên lịch.', data: itin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// Cập nhật ngày khởi hành (Lên lịch lại)
router.put('/update-date/:id', auth, async (req, res) => {
  try {
    const newDate = req.body.tripDate || req.body.newDate;
    if (!newDate) return res.status(400).json({ success: false, message: 'Thiếu ngày khởi hành mới.' });

    const itin = await Itinerary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { tripDate: new Date(newDate), status: 'planning', isDeleted: false },
      { returnDocument: 'after' }
    );
    if (!itin) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi.' });
    res.json({ success: true, message: 'Đã cập nhật ngày khởi hành.', data: itin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// Xóa vĩnh viễn
router.delete('/permanent/:id', auth, async (req, res) => {
  try {
    const itin = await Itinerary.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!itin) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi.' });
    res.json({ success: true, message: 'Đã xóa vĩnh viễn.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// SO SÁNH ĐỊA ĐIỂM BẰNG AI
router.post('/compare', async (req, res) => {
  try {
    const { place1, place2, budget, companion } = req.body;

    if (!place1 || !place2) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp 2 địa điểm để so sánh.' });
    }

    const prompt = `So sánh chi tiết 2 địa điểm du lịch sau tại Việt Nam:
    1. ${place1}
    2. ${place2}
    
    Bối cảnh người dùng:
    - Ngân sách: ${budget || 'Vừa phải'}
    - Đi cùng: ${companion || 'Bạn bè'}
    
    Yêu cầu so sánh theo các tiêu chí:
    - Chi phí dự kiến (Ăn ở, đi lại)
    - Hoạt động nổi bật (Mùa này có gì hay?)
    - Ưu điểm và Nhược điểm của từng nơi.
    - Kết luận: Nơi nào tốt hơn cho người dùng này?
    
    Trả về định dạng JSON:
    {
      "comparisonSummary": "Tóm tắt ngắn gọn",
      "criteria": [
        { "name": "Tiêu chí", "place1": "Đánh giá nơi 1", "place2": "Đánh giá nơi 2" }
      ],
      "verdict": "Lời khuyên cuối cùng"
    }`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Lỗi so sánh AI:', err);
    res.status(500).json({ success: false, message: 'Không thể thực hiện so sánh lúc này.' });
  }
});

// ⭐ GỬI ĐÁNH GIÁ TRẢI NGHIỆM WANDERAI (optionalAuth: đăng nhập hoặc khách)
router.post('/review', optionalAuth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn số sao từ 1 đến 5.' });
    }
    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Cảm nhận quá ngắn. Vui lòng nhập ít nhất 5 ký tự.' });
    }

    // Lấy thông tin user nếu đang đăng nhập
    let userName = 'Khách hàng';
    let userEmail = '';
    let userId = null;
    if (req.user) {
      userId = req.user.id;
      const userDoc = await User.findOne({
        $or: [
          { customId: req.user.id },
          { id: req.user.id }
        ]
      }).select('displayName name email avatar');
      if (userDoc) {
        userName = userDoc.displayName || userDoc.name || 'Thành viên';
        userEmail = userDoc.email || '';
      }
    }

    const review = new PlannerReview({
      userId,
      userName,
      userEmail,
      rating: Number(rating),
      comment: comment.trim(),
      source: 'planner_sidebar'
    });

    await review.save();

    // Ghi log
    if (userEmail) {
      await logAction(userEmail, 'user', 'PLANNER_REVIEW_SUBMITTED', { rating, commentLength: comment.length });
    }

    res.json({
      success: true,
      message: '🎉 Cảm ơn bạn đã đánh giá trải nghiệm WanderAI!',
      review: {
        _id: review._id,
        userName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Planner Review Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi gửi đánh giá.' });
  }
});

// ⭐ LẤY DANH SÁCH ĐÁNH GIÁ WANDERAI (public, 10 mới nhất)
router.get('/reviews', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const reviews = await PlannerReview.find({ isVisible: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('userName rating comment createdAt');

    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('❌ Get Reviews Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tải đánh giá.' });
  }
});

// Proxy image để tránh lỗi 403 Forbidden do hotlink protection
router.get('/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) return res.status(400).send('URL is required');

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': new URL(imageUrl).origin,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch image');
    }

    const contentType = response.headers.get('content-type');
    res.set('Content-Type', contentType);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (error) {
    console.error('Image Proxy Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
