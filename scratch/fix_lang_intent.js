const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/routes/chat.js';
let content = fs.readFileSync(path, 'utf8');

// --- The old langSwitchPatterns block (may have encoding issues) ---
// Find and replace the entire block from langSwitchPatterns to end of detectedIntentLang

const newLangBlock = `
    // --- INTENT-BASED LANGUAGE DETECTION ---
    // Uses simple keyword matching on the normalized (lowercased) message
    // This catches explicit language-switch requests typed in ANY language
    const msgLower = message.toLowerCase();
    
    // Map of target language keywords to language codes
    const LANG_KEYWORDS = {
      'en': ['tieng anh', 'tiếng anh', 'english', 'speak english', 'reply english', 'in english', 'nói tiếng anh', 'trả lời bằng tiếng anh', 'nói bằng tiếng anh', 'nói chuyện bằng tiếng anh', 'hãy nói tiếng anh', 'dùng tiếng anh'],
      'jp': ['tieng nhat', 'tiếng nhật', 'japanese', 'speak japanese', 'in japanese', 'nói tiếng nhật', 'trả lời bằng tiếng nhật'],
      'kr': ['tieng han', 'tiếng hàn', 'korean', 'speak korean', 'in korean', 'nói tiếng hàn', 'trả lời bằng tiếng hàn'],
      'fr': ['tieng phap', 'tiếng pháp', 'french', 'speak french', 'in french', 'nói tiếng pháp', 'trả lời bằng tiếng pháp'],
      'zh': ['tieng trung', 'tiếng trung', 'chinese', 'speak chinese', 'in chinese', 'nói tiếng trung', 'trả lời bằng tiếng trung'],
      'vi': ['tieng viet', 'tiếng việt', 'vietnamese', 'nói tiếng việt', 'trả lời bằng tiếng việt'],
    };

    // Check if the message explicitly requests a language switch
    let detectedIntentLang = null;
    for (const [lang, keywords] of Object.entries(LANG_KEYWORDS)) {
      if (keywords.some(kw => msgLower.includes(kw))) {
        detectedIntentLang = lang;
        break;
      }
    }
`;

// Replace the old block
const oldStart = content.indexOf('    // --- INTENT-BASED LANGUAGE DETECTION ---');
const oldEnd = content.indexOf('    const languageFullNames');

if (oldStart !== -1 && oldEnd !== -1) {
    content = content.substring(0, oldStart) + newLangBlock + '\n' + content.substring(oldEnd);
    console.log('✅ Replaced langSwitchPatterns block');
} else {
    console.log('❌ Block not found. Start:', oldStart, 'End:', oldEnd);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Saved chat.js');
