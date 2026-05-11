const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/routes/chat.js';
let content = fs.readFileSync(path, 'utf8');

const validationBlock = `
    const scriptDetectedLang = detectScriptLang(message);

    // --- USER LANGUAGE VALIDATION (STRICT MODE) ---
    if (targetLang !== 'auto' && scriptDetectedLang !== null) {
      let isInvalid = false;
      if (['en', 'fr'].includes(targetLang)) {
         if (['vi', 'kr', 'jp', 'zh'].includes(scriptDetectedLang)) isInvalid = true;
      } else if (targetLang === 'vi') {
         if (['kr', 'jp', 'zh'].includes(scriptDetectedLang)) isInvalid = true;
      } else if (['kr', 'jp', 'zh'].includes(targetLang)) {
         if (scriptDetectedLang !== targetLang) isInvalid = true;
      }

      if (isInvalid) {
         const langNames = { 'en': 'Tiếng Anh (English)', 'jp': 'Tiếng Nhật (日本語)', 'kr': 'Tiếng Hàn (한국어)', 'fr': 'Tiếng Pháp (Français)', 'vi': 'Tiếng Việt', 'zh': 'Tiếng Trung (中文)' };
         return res.json({
            success: true,
            answer: \`⚠️ Lỗi ngôn ngữ! Bạn đang chọn chế độ **\${langNames[targetLang]}\**. Vui lòng nhập bằng \${langNames[targetLang]} hoặc chuyển sang chế độ **AUTO**.\`,
            sessionId: currentSessionId,
            source: 'language-validation'
         });
      }
    }

    const effectiveLang = (targetLang !== 'auto') ? targetLang
      : (detectedIntentLang || scriptDetectedLang || 'auto');`;

const result = content.replace(
    /const scriptDetectedLang = detectScriptLang\(message\);\s*const effectiveLang = \(targetLang !== 'auto'\) \? targetLang\s*: \(detectedIntentLang \|\| scriptDetectedLang \|\| 'auto'\);/m,
    validationBlock
);

if (result !== content) {
    fs.writeFileSync(path, result, 'utf8');
    console.log("✅ Added strict language validation successfully");
} else {
    console.log("❌ Could not find target block");
}
