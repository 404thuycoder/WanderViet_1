const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/routes/chat.js';
let content = fs.readFileSync(path, 'utf8');

// FIX 1: SmartCache should be SKIPPED when a specific non-Vietnamese language is selected
// The SmartCache only has Vietnamese answers, so it should only be used for vi/auto
// Line 180: Already has the check `(targetLang === 'vi' || targetLang === 'auto')` - GOOD
// BUT after our changes, targetLang may be 'auto' while effectiveLang is 'en'
// We need to also skip SmartCache when effectiveLang (the actual resolved lang) is non-vi

// The SmartCache check is BEFORE effectiveLang is computed, so we need to move the 
// language detection BEFORE the SmartCache block

// First, let's find where msgLower is defined (it's in the langSwitch section)
// The LANG_KEYWORDS check is after SmartCache currently
// Let's restructure: move language detection BEFORE SmartCache

const oldSmartCacheCondition = `if (chatbotDb.readyState === 1 && message.length > 2 && (targetLang === 'vi' || targetLang === 'auto')) {`;
const newSmartCacheCondition = `// SmartCache only for Vietnamese/auto WITHOUT specific language intent
    // If user selected EN/JP/KR etc OR message has language switch intent, skip cache
    const _tempMsgLower = message.toLowerCase();
    const _hasLangIntent = ['tiếng anh','tieng anh','english','tiếng nhật','tiếng hàn','tiếng pháp','tiếng trung',
      'tieng nhat','tieng han','tieng phap','tieng trung','speak english','speak japanese','speak korean'].some(kw => _tempMsgLower.includes(kw));
    if (chatbotDb.readyState === 1 && message.length > 2 && (targetLang === 'vi' || targetLang === 'auto') && !_hasLangIntent) {`;

if (content.includes(oldSmartCacheCondition)) {
    content = content.replace(oldSmartCacheCondition, newSmartCacheCondition);
    console.log('✅ Fixed SmartCache condition');
} else {
    console.log('❌ SmartCache condition not found');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Saved chat.js');
