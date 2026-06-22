const Groq = require('groq-sdk');

// Cấu hình các pool key theo chủng loại (Category Pools)
const pools = {
  user_chatbot: [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY_PLANNER,
    process.env.GROQ_API_KEY_PLANNER_2,
    process.env.GROQ_API_KEY_PLANNER_3,
    process.env.GROQ_API_KEY_NAVIGATION,
    process.env.GROQ_API_KEY_ADMIN,
    process.env.GROQ_API_KEY_BUSINESS,
    process.env.GROQ_API_KEY_VISION,
    process.env.GROQ_API_KEY_VISION_2,
    process.env.GROQ_API_KEY_VISION_3
  ],
  planner: [
    process.env.GROQ_API_KEY_PLANNER,
    process.env.GROQ_API_KEY_PLANNER_2,
    process.env.GROQ_API_KEY_PLANNER_3,
    process.env.GROQ_API_KEY_PLANNER_4,
    process.env.GROQ_API_KEY_PLANNER_5,
    process.env.GROQ_API_KEY_PLANNER_6,
    process.env.GROQ_API_KEY_PLANNER_7
  ],
  navigation: [
    process.env.GROQ_API_KEY_NAVIGATION
  ],
  admin: [
    process.env.GROQ_API_KEY_ADMIN
  ],
  business: [
    process.env.GROQ_API_KEY_BUSINESS
  ],
  vision: [
    process.env.GROQ_API_KEY_VISION,
    process.env.GROQ_API_KEY_VISION_2,
    process.env.GROQ_API_KEY_VISION_3
  ]
};

// Dọn dẹp các key null, undefined, empty string và loại bỏ trùng lặp
Object.keys(pools).forEach(cat => {
  pools[cat] = Array.from(new Set(pools[cat].map(k => k ? k.trim() : null).filter(Boolean)));
});

// Chỉ số key hiện tại của từng pool
const currentIndices = {
  user_chatbot: 0,
  planner: 0,
  navigation: 0,
  admin: 0,
  business: 0,
  vision: 0
};

// Hàm lấy danh sách key khả dụng của một category, fallback về user_chatbot nếu category đó trống
function getKeyPool(category) {
  const pool = pools[category] || [];
  if (pool.length > 0) return pool;
  // Fallback về user_chatbot nếu không có key nào khác
  return pools.user_chatbot || [];
}

/**
 * Gọi Groq completions với tính năng tự động xoay vòng key cùng chủng loại khi gặp lỗi Rate Limit (429) hoặc hết token
 * @param {string} category - Chủng loại API Key ('user_chatbot', 'planner', 'navigation', 'admin', 'business')
 * @param {object} params - Tham số truyền vào Groq (messages, model, temperature, response_format, max_tokens, etc.)
 */
async function callGroq(category, params) {
  const pool = getKeyPool(category);
  const catKey = pools[category] && pools[category].length > 0 ? category : 'user_chatbot';
  
  if (pool.length === 0) {
    throw new Error(`Không tìm thấy API Key nào khả dụng cho nhóm: ${category}`);
  }

  const maxRetries = pool.length;
  let attempts = 0;

  while (attempts < maxRetries) {
    const idx = currentIndices[catKey] % pool.length;
    const apiKey = pool[idx];
    
    const client = new Groq({ apiKey });

    try {
      return await client.chat.completions.create(params);
    } catch (err) {
      const isRateLimit = err.status === 429 || (err.message && (err.message.includes('429') || err.message.includes('rate_limit') || err.message.includes('quota') || err.message.includes('limit')));
      
      if (isRateLimit && pool.length > 1) {
        attempts++;
        // Tăng index để xoay sang key tiếp theo trong pool
        currentIndices[catKey] = (currentIndices[catKey] + 1) % pool.length;
        console.warn(`🔄 [Groq Key Rotator] Key nhóm [${catKey}] bị giới hạn/hết token. Tự động xoay sang index ${currentIndices[catKey]}. Thử lại lần ${attempts}/${maxRetries}...`);
        continue;
      }
      
      // Nếu không phải lỗi Rate Limit hoặc chỉ có 1 key, ném lỗi ra ngoài
      throw err;
    }
  }

  throw new Error(`Tất cả các API Keys trong nhóm [${catKey}] đều đã hết lượt hoặc bị giới hạn băng thông.`);
}

module.exports = {
  callGroq,
  pools
};
