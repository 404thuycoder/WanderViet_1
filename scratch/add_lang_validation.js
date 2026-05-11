const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/routes/chat.js';
let content = fs.readFileSync(path, 'utf8');

const validationBlock = `
    // Final effective language priority:
    // 1. Explicit dropdown selector (targetLang !== 'auto')
    // 2. Explicit intent in message ("nói tiếng Anh")
    // 3. Server-side script detection
    // 4. Fall back to auto (let AI decide)
    const scriptDetectedLang = detectScriptLang(message);
    
    // --- USER LANGUAGE VALIDATION (STRICT MODE) ---
    // If user explicitly selected a language (NOT auto), they MUST speak in that language
    if (targetLang !== 'auto') {
      let isInvalid = false;
      
      // If they selected EN, FR -> scriptDetectedLang should be 'en' (Latin) or null, NOT vi, kr, jp, zh
      if (['en', 'fr'].includes(targetLang)) {
         if (['vi', 'kr', 'jp', 'zh'].includes(scriptDetectedLang)) isInvalid = true;
      }
      // If they selected VI -> scriptDetectedLang should be 'vi'
      // But we allow short words without diacritics. If it detects kr, jp, zh it's definitely invalid.
      // If it detects 'en', we might give it a pass or reject? Let's reject if it's very clearly another language.
      else if (targetLang === 'vi') {
         if (['kr', 'jp', 'zh'].includes(scriptDetectedLang)) isInvalid = true;
      }
      // If they selected KR, JP, ZH -> scriptDetectedLang MUST match exactly
      else if (['kr', 'jp', 'zh'].includes(targetLang)) {
         if (scriptDetectedLang !== targetLang) isInvalid = true;
      }

      if (isInvalid) {
         const langNames = {
            'en': 'Tiếng Anh (English)', 'jp': 'Tiếng Nhật (日本語)', 'kr': 'Tiếng Hàn (한국어)',
            'fr': 'Tiếng Pháp (Français)', 'vi': 'Tiếng Việt', 'zh': 'Tiếng Trung (中文)'
         };
         return res.json({
            success: true, // We return success: true so it shows as a normal bot message, not a system crash
            answer: \`⚠️ Bạn đang chọn chế độ **\${langNames[targetLang]}\**. Vui lòng nhập câu hỏi bằng \${langNames[targetLang]} hoặc chuyển sang chế độ **AUTO** để tự động nhận diện ngôn ngữ.\`,
            sessionId: currentSessionId,
            source: 'language-validation'
         });
      }
    }

    const effectiveLang = (targetLang !== 'auto') ? targetLang
      : (detectedIntentLang || scriptDetectedLang || 'auto');
`;

const searchStr = `    // Final effective language priority:
    // 1. Explicit dropdown selector (targetLang !== 'auto')
    // 2. Explicit intent in message ("nói tiếng Anh")
    // 3. Server-side script detection
    // 4. Fall back to auto (let AI decide)
    const scriptDetectedLang = detectScriptLang(message);
    const effectiveLang = (targetLang !== 'auto') ? targetLang
      : (detectedIntentLang || scriptDetectedLang || 'auto');`;

if (content.includes(searchStr)) {
    content = content.replace(searchStr, validationBlock);
    fs.writeFileSync(path, content, 'utf8');
    console.log("✅ Added strict language validation");
} else {
    console.log("❌ Could not find target block for validation injection");
}
