const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

// Cấu hình các pool key theo chủng loại (Category Pools)
const pools = {
  user_chatbot: [],
  planner: [],
  navigation: [],
  admin: [],
  business: [],
  vision: []
};

// Theo dõi chi tiết trạng thái của từng Key:
// { key: string, status: 'active' | 'exhausted' | 'invalid', retryAfter: number, failCount: number }
const poolTrackers = {
  user_chatbot: [],
  planner: [],
  navigation: [],
  admin: [],
  business: [],
  vision: []
};

let lastLoadedTime = 0;
const envPath = path.join(__dirname, '../../.env');

// Hàm phân tích file .env và cập nhật API keys dynamically
function checkAndReloadKeys() {
  try {
    if (!fs.existsSync(envPath)) return;
    const stats = fs.statSync(envPath);
    if (stats.mtimeMs <= lastLoadedTime) return; // Không có gì thay đổi

    const content = fs.readFileSync(envPath, 'utf8');
    const parsed = {};
    content.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let key = match[1];
        let value = match[2] || '';
        // Loại bỏ dấu nháy kép / nháy đơn bao bọc
        value = value.replace(/(^['"]|['"]$)/g, '').trim();
        parsed[key] = value;
      }
    });

    // Cấu trúc lại các pool từ file env mới nhất
    const rawConfig = {
      user_chatbot: [
        parsed.GROQ_API_KEY,
        parsed.GROQ_API_KEY_2,
        parsed.GROQ_API_KEY_3,
        parsed.GROQ_API_KEY_4,
        parsed.GROQ_API_KEY_5,
        parsed.GROQ_API_KEY_PLANNER,
        parsed.GROQ_API_KEY_PLANNER_2,
        parsed.GROQ_API_KEY_PLANNER_3,
        parsed.GROQ_API_KEY_PLANNER_4,
        parsed.GROQ_API_KEY_PLANNER_5,
        parsed.GROQ_API_KEY_PLANNER_6,
        parsed.GROQ_API_KEY_PLANNER_7,
        parsed.GROQ_API_KEY_NAVIGATION,
        parsed.GROQ_API_KEY_ADMIN,
        parsed.GROQ_API_KEY_BUSINESS,
        parsed.GROQ_API_KEY_VISION,
        parsed.GROQ_API_KEY_VISION_2,
        parsed.GROQ_API_KEY_VISION_3
      ],
      planner: [
        parsed.GROQ_API_KEY_PLANNER,
        parsed.GROQ_API_KEY_PLANNER_2,
        parsed.GROQ_API_KEY_PLANNER_3,
        parsed.GROQ_API_KEY_PLANNER_4,
        parsed.GROQ_API_KEY_PLANNER_5,
        parsed.GROQ_API_KEY_PLANNER_6,
        parsed.GROQ_API_KEY_PLANNER_7
      ],
      navigation: [
        parsed.GROQ_API_KEY_NAVIGATION
      ],
      admin: [
        parsed.GROQ_API_KEY_ADMIN
      ],
      business: [
        parsed.GROQ_API_KEY_BUSINESS
      ],
      vision: [
        parsed.GROQ_API_KEY_VISION,
        parsed.GROQ_API_KEY_VISION_2,
        parsed.GROQ_API_KEY_VISION_3
      ]
    };

    // Làm sạch và cập nhật
    Object.keys(pools).forEach(cat => {
      const keys = Array.from(new Set((rawConfig[cat] || []).map(k => k ? k.trim() : null).filter(Boolean)));
      pools[cat] = keys;

      // Cập nhật tracker: Giữ lại thông tin trạng thái cũ nếu Key vẫn tồn tại trong pool
      const currentTrackers = poolTrackers[cat] || [];
      poolTrackers[cat] = keys.map(key => {
        const existing = currentTrackers.find(t => t.key === key);
        if (existing) return existing;
        return {
          key,
          status: 'active',
          retryAfter: 0,
          failCount: 0
        };
      });
    });

    lastLoadedTime = stats.mtimeMs;
    console.log(`✅ [Groq Key Rotator] Đã cập nhật ${Object.values(pools).reduce((acc, p) => acc + p.length, 0)} API Keys từ file .env thành công.`);
  } catch (err) {
    console.error(`❌ [Groq Key Rotator] Lỗi khi reload file .env:`, err.message);
  }
}

// Chạy lần đầu tiên để khởi tạo các key
checkAndReloadKeys();

/**
 * Gọi Groq completions với cơ chế tự động xoay vòng và tự phục hồi
 * @param {string} category - Nhóm API Key ('user_chatbot', 'planner', 'navigation', 'admin', 'business', 'vision')
 * @param {object} params - Tham số truyền vào Groq (messages, model, temperature, etc.)
 */
async function callGroq(category, params) {
  // Tự động kiểm tra và reload nếu file .env thay đổi
  checkAndReloadKeys();

  const now = Date.now();
  let chosenTracker = null;

  // Lấy danh sách tracker tương ứng với category (fallback về user_chatbot nếu rỗng)
  let tracker = poolTrackers[category] || [];
  if (tracker.length === 0) {
    tracker = poolTrackers['user_chatbot'] || [];
  }

  // Bước 1: Tìm key 'active' khả dụng (không bị back-off)
  chosenTracker = tracker.find(t => t.status === 'active' && now >= t.retryAfter);

  // Bước 2: Nếu không có, tìm key 'exhausted' (rate limited cũ) đã hết thời gian chờ
  if (!chosenTracker) {
    chosenTracker = tracker.find(t => t.status === 'exhausted' && now >= t.retryAfter);
  }

  // Bước 3: Nếu vẫn không có, mượn key từ pool 'user_chatbot' (pool lớn nhất)
  if (!chosenTracker && category !== 'user_chatbot') {
    const fallbackTracker = poolTrackers['user_chatbot'] || [];
    chosenTracker = fallbackTracker.find(t => t.status === 'active' && now >= t.retryAfter);
    if (!chosenTracker) {
      chosenTracker = fallbackTracker.find(t => t.status === 'exhausted' && now >= t.retryAfter);
    }
  }

  // Bước 4: Nếu vẫn không tìm được, duyệt qua TẤT CẢ các pool khác để mượn key hoạt động bất kỳ
  if (!chosenTracker) {
    for (const cat of Object.keys(poolTrackers)) {
      if (cat === category || cat === 'user_chatbot') continue;
      const otherTracker = poolTrackers[cat] || [];
      chosenTracker = otherTracker.find(t => t.status === 'active' && now >= t.retryAfter);
      if (chosenTracker) break;
    }
  }

  // Bước 5: Cùng đường nhất - chọn key bất kỳ miễn là không phải 'invalid' có thời gian chờ ngắn nhất
  if (!chosenTracker) {
    let bestTracker = null;
    let minRetryAfter = Infinity;
    Object.keys(poolTrackers).forEach(cat => {
      (poolTrackers[cat] || []).forEach(t => {
        if (t.status !== 'invalid' && t.retryAfter < minRetryAfter) {
          minRetryAfter = t.retryAfter;
          bestTracker = t;
        }
      });
    });
    chosenTracker = bestTracker;
  }

  // Nếu hoàn toàn không còn key nào
  if (!chosenTracker) {
    throw new Error(`[Groq Rotator] Không tìm thấy bất kỳ API Key nào hoạt động trong hệ thống.`);
  }

  const { _attempt, ...groqParams } = params;
  const client = new Groq({ apiKey: chosenTracker.key });

  try {
    const res = await client.chat.completions.create(groqParams);
    
    // Gọi thành công: Reset lại trạng thái tốt cho key
    chosenTracker.status = 'active';
    chosenTracker.failCount = 0;
    chosenTracker.retryAfter = 0;
    return res;
  } catch (err) {
    const errStatus = err.status;
    const errMessage = err.message || '';
    
    const isRateLimit = errStatus === 429 || errMessage.includes('429') || errMessage.includes('rate_limit') || errMessage.includes('quota') || errMessage.includes('limit');
    const isAuthError = errStatus === 401 || errStatus === 403 || errMessage.includes('invalid') || errMessage.includes('Authentication') || errMessage.includes('unauthorized') || errMessage.includes('API key');

    if (isRateLimit) {
      chosenTracker.status = 'exhausted';
      chosenTracker.retryAfter = Date.now() + 60000; // Khóa tạm thời 1 phút
      console.warn(`🔄 [Groq Rotator] Key bị giới hạn lượt/băng thông (429). Đặt trạng thái 'exhausted' 1 phút.`);
    } else if (isAuthError) {
      chosenTracker.status = 'invalid';
      chosenTracker.retryAfter = Infinity; // Khóa vĩnh viễn cho đến khi thay đổi .env
      console.error(`❌ [Groq Rotator] Key không hợp lệ hoặc đã bị vô hiệu hóa (401/403). Đặt trạng thái 'invalid'.`);
    } else {
      chosenTracker.failCount++;
      chosenTracker.retryAfter = Date.now() + 15000; // Lỗi mạng/tạm thời khác: Khóa 15 giây
      console.warn(`⚠️ [Groq Rotator] Lỗi API khi gọi Groq: ${errMessage}. Tạm khóa key 15s.`);
    }

    // Đếm tổng số key hoạt động để làm giới hạn thử lại đệ quy
    const totalActiveKeysCount = Object.values(poolTrackers).reduce((sum, list) => {
      return sum + list.filter(t => t.status !== 'invalid').length;
    }, 0);

    const currentAttempt = (_attempt || 0) + 1;
    if (currentAttempt < Math.max(totalActiveKeysCount, 3)) {
      console.log(`🔄 [Groq Rotator] Đang chuyển sang key khác (Thử lại lần ${currentAttempt})...`);
      const retryParams = { ...params, _attempt: currentAttempt };
      return await callGroq(category, retryParams);
    } else {
      throw new Error(`[Groq Rotator] Đã thử qua tất cả các API keys khả dụng nhưng đều thất bại. Lỗi cuối cùng: ${errMessage}`);
    }
  }
}

module.exports = {
  callGroq,
  pools
};
